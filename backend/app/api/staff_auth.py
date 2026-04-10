from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from app.database import get_db
from app.models.staff_user import StaffUser
from app.models.staff_refresh_token import StaffRefreshToken
from app.schemas.staff_user import StaffLogin, StaffCreate, StaffTokenResponse, PasswordChange
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

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
        path="/api/staff/auth",
    )


def _make_access_token(staff: StaffUser) -> str:
    return create_access_token(
        data={
            "sub": staff.email,
            "staff_id": str(staff.staff_id),
            "role": staff.role,
        }
    )


def get_current_staff(authorization: str = Header(None), db: Session = Depends(get_db)) -> StaffUser:
    """Dependency — validates the Bearer token and returns the StaffUser."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = verify_token(authorization.removeprefix("Bearer "))
    staff_id = payload.get("staff_id") if payload else None
    if not staff_id:
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


@router.post("/login", response_model=StaffTokenResponse)
def staff_login(data: StaffLogin, response: Response, db: Session = Depends(get_db)):
    staff = db.query(StaffUser).filter(StaffUser.email == data.email).first()

    if not staff or not verify_password(data.password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
        path="/api/staff/auth",
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


@router.post("/create", response_model=StaffTokenResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    data: StaffCreate,
    db: Session = Depends(get_db),
    _admin: StaffUser = Depends(require_role("admin")),
):
    """Admin-only endpoint to provision a new staff account."""
    if db.query(StaffUser).filter(StaffUser.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A staff account with this email already exists",
        )

    new_staff = StaffUser(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    access_token = _make_access_token(new_staff)
    return {"access_token": access_token, "token_type": "bearer", "staff": new_staff}
