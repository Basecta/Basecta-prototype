from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Literal
import re

VALID_ROLES = {"admin", "ecologist", "surveyor"}


class StaffLogin(BaseModel):
    email: EmailStr
    password: str


class StaffCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["admin", "ecologist", "surveyor"]

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return v.strip()


class StaffResponse(BaseModel):
    staff_id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    staff_id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime
    account_setup_complete: bool
    totp_enabled: bool

    class Config:
        from_attributes = True


class StaffTokenResponse(BaseModel):
    access_token: str
    token_type: str
    staff: StaffResponse


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class SetupSetPassword(BaseModel):
    setup_token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class SetupConfirmTotp(BaseModel):
    setup_token: str
    totp_code: str


class TotpValidate(BaseModel):
    mfa_token: str
    totp_code: str
