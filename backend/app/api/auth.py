from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import re
import json
import secrets
import urllib.request
from app.database import get_db
from app.models.user import User
from app.models.pending_verification import PendingVerification
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.schemas.user import (
    UserCreateVerified,
    UserLogin,
    UserResponse,
    TokenResponse,
    PasswordChange,
    GoogleLogin,
    GoogleTokenResponse,
    SendVerification,
    VerifyCode,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_token,
    generate_reset_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.utils.email import send_verification_code, send_password_reset_email
from app.utils.rate_limiter import email_send_limiter, ip_send_limiter

def _verify_google_token(id_token: str) -> dict | None:
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception:
        return None

def _set_refresh_cookie(user: User, db: Session, response: Response) -> None:
    """Issue a new refresh token, store its hash, and set an httpOnly cookie."""
    # Opportunistic cleanup: remove expired refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.user_id,
        RefreshToken.expires_at < datetime.utcnow(),
    ).delete()

    raw_token = create_refresh_token()
    stored = RefreshToken(
        token_hash=hash_token(raw_token),
        user_id=user.user_id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(stored)
    db.commit()

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="refresh_token",
        value=raw_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",
    )

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-verification", status_code=status.HTTP_200_OK)
def send_verification(data: SendVerification, request: Request, db: Session = Depends(get_db)):
    # Rate limit by IP and by email address
    client_ip = request.headers.get("X-Forwarded-For", request.client.host or "").split(",")[0].strip()
    if not ip_send_limiter.is_allowed(client_ip) or not email_send_limiter.is_allowed(data.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before requesting another code."
        )

    # Opportunistic cleanup: delete all expired rows across all emails
    db.query(PendingVerification).filter(PendingVerification.expires_at < datetime.utcnow()).delete()

    # If the email is already registered, return success silently without sending anything.
    # This prevents enumeration of existing accounts.
    if db.query(User).filter(User.email == data.email).first():
        return {"message": "Verification code sent"}

    # Remove any existing pending verification for this email
    db.query(PendingVerification).filter(PendingVerification.email == data.email).delete()

    # Generate a zero-padded 6-digit code
    code = f"{secrets.randbelow(1_000_000):06d}"

    pending = PendingVerification(
        email=data.email,
        code=code,
        attempts=0,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(pending)
    db.commit()

    send_verification_code(data.email, code)

    return {"message": "Verification code sent"}


@router.post("/verify-code", status_code=status.HTTP_200_OK)
def verify_code(data: VerifyCode, db: Session = Depends(get_db)):
    pending = db.query(PendingVerification).filter(
        PendingVerification.email == data.email
    ).first()

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification pending for this email. Please request a new code."
        )

    if datetime.utcnow() > pending.expires_at:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if pending.attempts >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum attempts reached. Please request a new code."
        )

    if pending.code != data.code:
        pending.attempts += 1
        db.commit()
        remaining = 3 - pending.attempts
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect code. No attempts remaining. Please request a new code."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        )

    # Code is correct — delete it and issue a short-lived verified token
    db.delete(pending)
    db.commit()

    verified_token = create_access_token(
        data={"verified_email": data.email},
        expires_delta=timedelta(minutes=15),
    )
    return {"verified_token": verified_token}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreateVerified, response: Response, db: Session = Depends(get_db)):
    # Validate that the email was verified
    payload = verify_token(user_data.verification_token)
    if not payload or payload.get("verified_email") != user_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification. Please verify your email again."
        )

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": str(new_user.user_id)},
    )
    _set_refresh_cookie(new_user, db, response)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or user.hashed_password is None or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.user_id)},
    )
    _set_refresh_cookie(user, db, response)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == hash_token(raw_token)
    ).first()

    if not stored or datetime.utcnow() > stored.expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.user_id == stored.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Token rotation: revoke old token, issue new one
    db.delete(stored)
    db.commit()

    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.user_id)},
    )
    _set_refresh_cookie(user, db, response)

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        db.query(RefreshToken).filter(
            RefreshToken.token_hash == hash_token(raw_token)
        ).delete()
        db.commit()

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/api/auth",
    )
    return {"message": "Logged out"}


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(User.email == payload.get("sub")).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.hashed_password is not None:
        if not verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

    user.hashed_password = hash_password(password_data.new_password)
    db.commit()

    return {"message": "Password successfully changed"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    # Always return the same response to prevent email enumeration.
    # Also silently skip Google-only accounts (no password to reset).
    if not user or user.hashed_password is None:
        return {"message": "If that email is registered, you'll receive a reset link shortly."}

    # Opportunistic cleanup: remove all expired tokens across all users
    db.query(PasswordResetToken).filter(
        PasswordResetToken.expires_at < datetime.utcnow()
    ).delete()

    # Invalidate any remaining unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
    ).delete()

    token = generate_reset_token()
    reset_token = PasswordResetToken(
        token=token,
        user_id=user.user_id,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset_token)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    send_password_reset_email(user.email, reset_link)

    return {"message": "If that email is registered, you'll receive a reset link shortly."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token
    ).first()

    if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one."
        )

    user = db.query(User).filter(User.user_id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.hashed_password and verify_password(data.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password."
        )

    user.hashed_password = hash_password(data.new_password)
    db.delete(reset_token)
    db.commit()

    return {"message": "Password successfully reset. You can now log in."}


@router.post("/google", response_model=GoogleTokenResponse)
def google_login(data: GoogleLogin, response: Response, db: Session = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="Google authentication is not configured")

    token_info = _verify_google_token(data.id_token)
    if not token_info or token_info.get("aud") != client_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    if token_info.get("email_verified") != "true":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email is not verified")

    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not retrieve email from Google account")

    user = db.query(User).filter(User.email == email).first()
    is_new_user = user is None

    if is_new_user:
        raw_name = token_info.get("name", "").replace(" ", "_")
        base_username = re.sub(r'[^a-zA-Z0-9_]', '', raw_name)[:20] or re.sub(r'[^a-zA-Z0-9_]', '', email.split('@')[0])[:20] or "user"
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(username=username, email=email, hashed_password=None)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.user_id)},
    )
    _set_refresh_cookie(user, db, response)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "is_new_user": is_new_user,
    }
