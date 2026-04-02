from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
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
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.utils.email import send_verification_code
from app.utils.rate_limiter import email_send_limiter, ip_send_limiter

def _verify_google_token(id_token: str) -> dict | None:
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception:
        return None

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
def register(user_data: UserCreateVerified, db: Session = Depends(get_db)):
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": str(new_user.user_id)},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or user.hashed_password is None or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.user_id)},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


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


@router.post("/google", response_model=GoogleTokenResponse)
def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
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
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "is_new_user": is_new_user,
    }
