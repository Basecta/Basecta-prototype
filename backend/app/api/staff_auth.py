from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from app.database import get_db
from app.models.staff_user import StaffUser
from app.models.staff_refresh_token import StaffRefreshToken
from app.schemas.staff_user import (
    StaffLogin,
    StaffCreate,
    StaffListResponse,
    StaffTokenResponse,
    PasswordChange,
    SetupSetPassword,
    SetupConfirmTotp,
    TotpValidate,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_token,
    generate_totp_secret,
    get_totp_uri,
    verify_totp_code,
    generate_temp_password,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.utils.email import send_staff_welcome_email
from typing import List

router = APIRouter(prefix="/api/staff/auth", tags=["staff-auth"])


def _set_staff_refresh_cookie(staff: StaffUser, db: Session, response: Response) -> None:
    """Issue a new staff refresh token, store its hash, and set an httpOnly cookie."""
    db.query(StaffRefreshToken).filter(
        StaffRefreshToken.staff_id == staff.staff_id,
        StaffRefreshToken.expires_at < datetime.utcnow(),
    ).delete()

    raw_token = create_refresh_token()
    stored = StaffRefreshToken(
        token_hash=hash_token(raw_token),
        staff_id=staff.staff_id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(stored)
    db.commit()

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="staff_refresh_token",
        value=raw_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def _make_access_token(staff: StaffUser) -> str:
    return create_access_token(
        data={
            "sub": staff.email,
            "staff_id": str(staff.staff_id),
            "role": staff.role,
        }
    )


def _get_staff_from_special_token(token: str, expected_type: str, db: Session) -> StaffUser:
    """Validate a setup or mfa_pending token and return the StaffUser."""
    payload = verify_token(token)
    if not payload or payload.get("token_type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    staff_id = payload.get("staff_id")
    staff = db.query(StaffUser).filter(StaffUser.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff user not found")
    return staff


def get_current_staff(authorization: str = Header(None), db: Session = Depends(get_db)) -> StaffUser:
    """Dependency — validates the Bearer token and returns the StaffUser."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = verify_token(authorization.removeprefix("Bearer "))
    staff_id = payload.get("staff_id") if payload else None
    if not staff_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Reject setup/mfa tokens — they are not valid session tokens
    if payload.get("token_type") in ("setup", "mfa_pending"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    staff = db.query(StaffUser).filter(StaffUser.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff user not found")
    return staff


def require_role(*roles: str):
    """Dependency factory — ensures the authenticated staff member has one of the given roles."""
    def _check(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
        if staff.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return staff
    return _check


@router.post("/login")
def staff_login(data: StaffLogin, response: Response, db: Session = Depends(get_db)):
    staff = db.query(StaffUser).filter(StaffUser.email == data.email).first()

    if not staff or not verify_password(data.password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # First login: account not yet set up — return a short-lived setup token
    if not staff.account_setup_complete:
        setup_token = create_access_token(
            data={"sub": staff.email, "staff_id": str(staff.staff_id), "token_type": "setup"},
            expires_delta=timedelta(minutes=15),
        )
        return {"setup_required": True, "setup_token": setup_token}

    # TOTP enabled: return a short-lived MFA-pending token
    if staff.totp_enabled:
        mfa_token = create_access_token(
            data={"sub": staff.email, "staff_id": str(staff.staff_id), "token_type": "mfa_pending"},
            expires_delta=timedelta(minutes=5),
        )
        return {"totp_required": True, "mfa_token": mfa_token}

    # Normal login
    access_token = _make_access_token(staff)
    _set_staff_refresh_cookie(staff, db, response)
    return {"access_token": access_token, "token_type": "bearer", "staff": staff}


@router.post("/setup/set-password")
def setup_set_password(data: SetupSetPassword, db: Session = Depends(get_db)):
    """First-login step 1: set a new password and receive the TOTP QR code."""
    staff = _get_staff_from_special_token(data.setup_token, "setup", db)

    if staff.account_setup_complete:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account setup already complete")

    if verify_password(data.new_password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your temporary password",
        )

    staff.hashed_password = hash_password(data.new_password)
    secret = generate_totp_secret()
    staff.totp_secret = secret
    db.commit()

    return {"qr_uri": get_totp_uri(secret, staff.email), "secret": secret}


@router.post("/setup/confirm-totp", response_model=StaffTokenResponse)
def setup_confirm_totp(data: SetupConfirmTotp, response: Response, db: Session = Depends(get_db)):
    """First-login step 2: confirm the TOTP code to activate 2FA and complete account setup."""
    staff = _get_staff_from_special_token(data.setup_token, "setup", db)

    if staff.account_setup_complete:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account setup already complete")

    if not staff.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password setup not completed")

    if not verify_totp_code(staff.totp_secret, data.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authenticator code")

    staff.totp_enabled = True
    staff.account_setup_complete = True
    db.commit()

    access_token = _make_access_token(staff)
    _set_staff_refresh_cookie(staff, db, response)
    return {"access_token": access_token, "token_type": "bearer", "staff": staff}


@router.post("/totp/validate", response_model=StaffTokenResponse)
def totp_validate(data: TotpValidate, response: Response, db: Session = Depends(get_db)):
    """Returning login step: validate the TOTP code and issue a full session."""
    staff = _get_staff_from_special_token(data.mfa_token, "mfa_pending", db)

    if not staff.totp_enabled or not staff.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP not enabled for this account")

    if not verify_totp_code(staff.totp_secret, data.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authenticator code")

    access_token = _make_access_token(staff)
    _set_staff_refresh_cookie(staff, db, response)
    return {"access_token": access_token, "token_type": "bearer", "staff": staff}


@router.post("/refresh")
def staff_refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("staff_refresh_token")
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    stored = db.query(StaffRefreshToken).filter(
        StaffRefreshToken.token_hash == hash_token(raw_token)
    ).first()

    if not stored or datetime.utcnow() > stored.expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    staff = db.query(StaffUser).filter(StaffUser.staff_id == stored.staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff user not found")

    # Token rotation: revoke old, issue new
    db.delete(stored)
    db.commit()

    access_token = _make_access_token(staff)
    _set_staff_refresh_cookie(staff, db, response)

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def staff_logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("staff_refresh_token")
    if raw_token:
        db.query(StaffRefreshToken).filter(
            StaffRefreshToken.token_hash == hash_token(raw_token)
        ).delete()
        db.commit()

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.delete_cookie(
        key="staff_refresh_token",
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
    )
    return {"message": "Logged out"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_staff_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(get_current_staff),
):
    if not verify_password(data.current_password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if verify_password(data.new_password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password",
        )
    staff.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_staff_account(
    data: StaffCreate,
    db: Session = Depends(get_db),
    _admin: StaffUser = Depends(require_role("admin")),
):
    """Admin-only: provision a new staff account, auto-generate a temp password, and email the credentials."""
    if db.query(StaffUser).filter(StaffUser.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A staff account with this email already exists",
        )

    temp_password = generate_temp_password()

    new_staff = StaffUser(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(temp_password),
        role=data.role,
        account_setup_complete=False,
        totp_enabled=False,
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    login_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/staff/login"
    try:
        send_staff_welcome_email(data.email, data.full_name, temp_password, login_url)
    except Exception:
        # Don't fail the whole request if email sending fails — account is already created
        pass

    return {"message": f"Account created for {data.email}. Login credentials have been sent to their email."}


@router.get("/users", response_model=List[StaffListResponse])
def list_staff_users(
    db: Session = Depends(get_db),
    _admin: StaffUser = Depends(require_role("admin")),
):
    """Admin-only: return all staff accounts ordered by creation date."""
    return db.query(StaffUser).order_by(StaffUser.created_at.desc()).all()
