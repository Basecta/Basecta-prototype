"""Tests for staff auth + staff notification endpoints."""

from app.models.staff_user import StaffUser
from app.models.staff_refresh_token import StaffRefreshToken
from app.models.staff_notification import StaffNotification
from app.utils.security import hash_password, create_access_token


def _make_staff(db, role="ecologist", email="eco@basecta.com", name="Eco User"):
    s = StaffUser(
        email=email,
        full_name=name,
        hashed_password=hash_password("Staff1234!"),
        role=role,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def _staff_token(staff):
    return create_access_token(
        data={"sub": staff.email, "staff_id": str(staff.staff_id), "role": staff.role}
    )


def _staff_header(staff):
    return {"Authorization": f"Bearer {_staff_token(staff)}"}


# ── Staff login ────────────────────────────────────────────────────────────────

class TestStaffLogin:
    def test_login_success(self, client, db):
        _make_staff(db)
        resp = client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "Staff1234!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["staff"]["role"] == "ecologist"
        assert "access_token" in data

    def test_login_wrong_password(self, client, db):
        _make_staff(db)
        resp = client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "WrongPass1!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent(self, client):
        resp = client.post("/api/staff/auth/login", json={
            "email": "nobody@basecta.com",
            "password": "Staff1234!",
        })
        assert resp.status_code == 401

    def test_login_sets_cookie(self, client, db):
        _make_staff(db)
        resp = client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "Staff1234!",
        })
        assert "staff_refresh_token" in resp.cookies


# ── Staff refresh ──────────────────────────────────────────────────────────────

class TestStaffRefresh:
    def test_refresh_success(self, client, db):
        _make_staff(db)
        client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "Staff1234!",
        })
        resp = client.post("/api/staff/auth/refresh")
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_no_cookie(self, client):
        resp = client.post("/api/staff/auth/refresh")
        assert resp.status_code == 401


# ── Staff logout ───────────────────────────────────────────────────────────────

class TestStaffLogout:
    def test_logout(self, client, db):
        staff = _make_staff(db)
        client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "Staff1234!",
        })
        assert db.query(StaffRefreshToken).filter(StaffRefreshToken.staff_id == staff.staff_id).count() == 1

        resp = client.post("/api/staff/auth/logout")
        assert resp.status_code == 200
        assert db.query(StaffRefreshToken).filter(StaffRefreshToken.staff_id == staff.staff_id).count() == 0


# ── Staff change password ─────────────────────────────────────────────────────

class TestStaffChangePassword:
    def test_change_password_success(self, client, db):
        staff = _make_staff(db)
        resp = client.post("/api/staff/auth/change-password", json={
            "current_password": "Staff1234!",
            "new_password": "NewStaff1234!",
        }, headers=_staff_header(staff))
        assert resp.status_code == 200

        # Verify new password works
        login_resp = client.post("/api/staff/auth/login", json={
            "email": "eco@basecta.com",
            "password": "NewStaff1234!",
        })
        assert login_resp.status_code == 200

    def test_change_password_wrong_current(self, client, db):
        staff = _make_staff(db)
        resp = client.post("/api/staff/auth/change-password", json={
            "current_password": "WrongPass1!",
            "new_password": "NewStaff1234!",
        }, headers=_staff_header(staff))
        assert resp.status_code == 400

    def test_change_password_same_as_current(self, client, db):
        staff = _make_staff(db)
        resp = client.post("/api/staff/auth/change-password", json={
            "current_password": "Staff1234!",
            "new_password": "Staff1234!",
        }, headers=_staff_header(staff))
        assert resp.status_code == 400


# ── Staff create (admin only) ─────────────────────────────────────────────────

class TestStaffCreate:
    def test_admin_creates_staff(self, client, db, staff_auth_header):
        resp = client.post("/api/staff/auth/create", json={
            "email": "newstaff@basecta.com",
            "full_name": "New Staffer",
            "password": "NewStaff1234!",
            "role": "surveyor",
        }, headers=staff_auth_header)
        assert resp.status_code == 201
        data = resp.json()
        assert data["staff"]["role"] == "surveyor"
        assert data["staff"]["email"] == "newstaff@basecta.com"

    def test_non_admin_cannot_create(self, client, db):
        eco = _make_staff(db, role="ecologist")
        resp = client.post("/api/staff/auth/create", json={
            "email": "another@basecta.com",
            "full_name": "Another",
            "password": "Another1234!",
            "role": "surveyor",
        }, headers=_staff_header(eco))
        assert resp.status_code == 403

    def test_duplicate_email(self, client, db, staff_auth_header):
        _make_staff(db, email="existing@basecta.com")
        resp = client.post("/api/staff/auth/create", json={
            "email": "existing@basecta.com",
            "full_name": "Duplicate",
            "password": "Dupe1234!",
            "role": "ecologist",
        }, headers=staff_auth_header)
        assert resp.status_code == 400

    def test_no_auth(self, client):
        resp = client.post("/api/staff/auth/create", json={
            "email": "x@basecta.com",
            "full_name": "X",
            "password": "Pass1234!",
            "role": "ecologist",
        })
        assert resp.status_code == 401


# ── Staff notifications ────────────────────────────────────────────────────────

class TestStaffNotifications:
    def test_get_notifications(self, client, db):
        staff = _make_staff(db)
        n = StaffNotification(
            staff_id=staff.staff_id,
            notification_key="test_staff_notif",
            title="Test",
            message="Hello staff",
        )
        db.add(n)
        db.commit()

        resp = client.get("/api/staff/notifications", headers=_staff_header(staff))
        assert resp.status_code == 200
        keys = [notif["notification_key"] for notif in resp.json()]
        assert "test_staff_notif" in keys

    def test_mark_read(self, client, db):
        staff = _make_staff(db)
        n = StaffNotification(
            staff_id=staff.staff_id,
            notification_key="read_test",
            title="Read",
            message="Mark me",
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        resp = client.patch(f"/api/staff/notifications/{n.id}/read", headers=_staff_header(staff))
        assert resp.status_code == 200
        assert resp.json()["read"] is True

    def test_dismiss(self, client, db):
        staff = _make_staff(db)
        n = StaffNotification(
            staff_id=staff.staff_id,
            notification_key="dismiss_test",
            title="Dismiss",
            message="Dismiss me",
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        resp = client.delete(f"/api/staff/notifications/{n.id}", headers=_staff_header(staff))
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_not_found(self, client, db):
        import uuid
        staff = _make_staff(db)
        resp = client.patch(f"/api/staff/notifications/{uuid.uuid4()}/read", headers=_staff_header(staff))
        assert resp.status_code == 404

    def test_no_auth(self, client):
        resp = client.get("/api/staff/notifications")
        assert resp.status_code == 401
