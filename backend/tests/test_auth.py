"""Tests for user authentication endpoints (/api/auth)."""

import pytest
from unittest.mock import patch
from app.models.user import User
from app.models.pending_verification import PendingVerification
from app.models.refresh_token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.utils.security import hash_password, create_access_token, hash_token
from datetime import datetime, timedelta


# ── Registration flow ──────────────────────────────────────────────────────────

class TestRegister:
    def _get_verified_token(self, email: str) -> str:
        return create_access_token(
            data={"verified_email": email},
            expires_delta=timedelta(minutes=15),
        )

    def test_register_success(self, client, db):
        token = self._get_verified_token("new@example.com")
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "Secure1234!",
            "verification_token": token,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["username"] == "newuser"
        assert "access_token" in data

        # User should exist in DB
        user = db.query(User).filter(User.email == "new@example.com").first()
        assert user is not None

    def test_register_duplicate_email(self, client, db, user_and_token):
        """Registering with an existing email should fail."""
        user, _ = user_and_token
        token = self._get_verified_token(user.email)
        resp = client.post("/api/auth/register", json={
            "username": "different",
            "email": user.email,
            "password": "Secure1234!",
            "verification_token": token,
        })
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_duplicate_username(self, client, db, user_and_token):
        user, _ = user_and_token
        token = self._get_verified_token("other@example.com")
        resp = client.post("/api/auth/register", json={
            "username": user.username,
            "email": "other@example.com",
            "password": "Secure1234!",
            "verification_token": token,
        })
        assert resp.status_code == 400
        assert "username" in resp.json()["detail"].lower()

    def test_register_invalid_verification_token(self, client, db):
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "Secure1234!",
            "verification_token": "bogus-token",
        })
        assert resp.status_code == 400

    def test_register_weak_password_rejected(self, client, db):
        """Password validation should reject weak passwords."""
        token = self._get_verified_token("new@example.com")
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "short",
            "verification_token": token,
        })
        assert resp.status_code == 422  # Pydantic validation error


# ── Login ──────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client, user_and_token):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"
        assert "access_token" in data

    def test_login_wrong_password(self, client, user_and_token):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPassword1!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 401

    def test_login_sets_refresh_cookie(self, client, user_and_token):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 200
        assert "refresh_token" in resp.cookies


# ── Token refresh ──────────────────────────────────────────────────────────────

class TestRefresh:
    def test_refresh_success(self, client, db, user_and_token):
        user, _ = user_and_token
        # Login first to get a refresh cookie
        login_resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert login_resp.status_code == 200

        # Use the cookie to refresh
        resp = client.post("/api/auth/refresh")
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_no_cookie(self, client):
        resp = client.post("/api/auth/refresh")
        assert resp.status_code == 401

    def test_refresh_rotates_token(self, client, db, user_and_token):
        """After refresh, the old token hash should be gone and a new one present."""
        user, _ = user_and_token
        client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        count_before = db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count()

        client.post("/api/auth/refresh")
        count_after = db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count()
        # Should still have exactly 1 token (old deleted, new created)
        assert count_before == count_after == 1


# ── Logout ─────────────────────────────────────────────────────────────────────

class TestLogout:
    def test_logout_clears_token(self, client, db, user_and_token):
        user, _ = user_and_token
        client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count() == 1

        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count() == 0

    def test_logout_without_cookie(self, client):
        """Logout should succeed even without a cookie."""
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200


# ── Change password ────────────────────────────────────────────────────────────

class TestChangePassword:
    def test_change_password_success(self, client, auth_header):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "Test1234!",
            "new_password": "NewPass1234!",
        }, headers=auth_header)
        assert resp.status_code == 200

        # Verify new password works for login
        login_resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "NewPass1234!",
        })
        assert login_resp.status_code == 200

    def test_change_password_wrong_current(self, client, auth_header):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "WrongPassword1!",
            "new_password": "NewPass1234!",
        }, headers=auth_header)
        assert resp.status_code == 400

    def test_change_password_no_auth(self, client):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "Test1234!",
            "new_password": "NewPass1234!",
        })
        assert resp.status_code == 401


# ── Forgot / reset password ───────────────────────────────────────────────────

class TestPasswordReset:
    @patch("app.api.auth.send_password_reset_email")
    def test_forgot_password_existing_email(self, mock_send, client, user_and_token, db):
        user, _ = user_and_token
        resp = client.post("/api/auth/forgot-password", json={
            "email": user.email,
        })
        assert resp.status_code == 200
        # Should have created a reset token in DB
        assert db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.user_id
        ).count() == 1
        mock_send.assert_called_once()

    def test_forgot_password_nonexistent_email(self, client):
        """Should return 200 even for unknown emails (prevents enumeration)."""
        resp = client.post("/api/auth/forgot-password", json={
            "email": "nobody@example.com",
        })
        assert resp.status_code == 200

    @patch("app.api.auth.send_password_reset_email")
    def test_reset_password_success(self, mock_send, client, db, user_and_token):
        user, _ = user_and_token
        from app.utils.security import generate_reset_token
        token = generate_reset_token()
        rt = PasswordResetToken(
            token=token,
            user_id=user.user_id,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(rt)
        db.commit()

        resp = client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "BrandNew1234!",
        })
        assert resp.status_code == 200

        # Should be able to login with new password
        login_resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "BrandNew1234!",
        })
        assert login_resp.status_code == 200

    def test_reset_password_invalid_token(self, client):
        resp = client.post("/api/auth/reset-password", json={
            "token": "bogus-token",
            "new_password": "BrandNew1234!",
        })
        assert resp.status_code == 400

    @patch("app.api.auth.send_password_reset_email")
    def test_reset_password_expired_token(self, mock_send, client, db, user_and_token):
        user, _ = user_and_token
        from app.utils.security import generate_reset_token
        token = generate_reset_token()
        rt = PasswordResetToken(
            token=token,
            user_id=user.user_id,
            expires_at=datetime.utcnow() - timedelta(hours=1),  # already expired
        )
        db.add(rt)
        db.commit()

        resp = client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "BrandNew1234!",
        })
        assert resp.status_code == 400


# ── Email verification ─────────────────────────────────────────────────────────

class TestEmailVerification:
    @patch("app.api.auth.send_verification_code")
    def test_send_verification(self, mock_send, client, db):
        resp = client.post("/api/auth/send-verification", json={
            "email": "verify@example.com",
        })
        assert resp.status_code == 200
        mock_send.assert_called_once()

        # Pending verification row should exist
        pv = db.query(PendingVerification).filter(
            PendingVerification.email == "verify@example.com"
        ).first()
        assert pv is not None
        assert len(pv.code) == 6

    @patch("app.api.auth.send_verification_code")
    def test_verify_code_correct(self, mock_send, client, db):
        # Insert a pending verification directly
        pv = PendingVerification(
            email="verify@example.com",
            code="123456",
            attempts=0,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )
        db.add(pv)
        db.commit()

        resp = client.post("/api/auth/verify-code", json={
            "email": "verify@example.com",
            "code": "123456",
        })
        assert resp.status_code == 200
        assert "verified_token" in resp.json()

    @patch("app.api.auth.send_verification_code")
    def test_verify_code_wrong(self, mock_send, client, db):
        pv = PendingVerification(
            email="verify@example.com",
            code="123456",
            attempts=0,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )
        db.add(pv)
        db.commit()

        resp = client.post("/api/auth/verify-code", json={
            "email": "verify@example.com",
            "code": "000000",
        })
        assert resp.status_code == 400
        assert "incorrect" in resp.json()["detail"].lower()

    def test_verify_code_max_attempts(self, client, db):
        pv = PendingVerification(
            email="verify@example.com",
            code="123456",
            attempts=3,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )
        db.add(pv)
        db.commit()

        resp = client.post("/api/auth/verify-code", json={
            "email": "verify@example.com",
            "code": "123456",
        })
        assert resp.status_code == 400
        assert "maximum" in resp.json()["detail"].lower()
