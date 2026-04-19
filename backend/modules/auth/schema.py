from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str   # 6-digit string


class PasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordUpdate(BaseModel):
    new_password: str


class UserKeysUpdate(BaseModel):
    groq_api_key: str | None = None


class UserOut(BaseModel):
    id: UUID
    name: str | None
    email: str
    is_active: bool
    groq_api_key: str | None = None
    created_at: datetime

    @field_validator("groq_api_key")
    @classmethod
    def mask_keys(cls, v: str | None) -> str | None:
        if not v:
            return None
        # Return masked version like gsk_...****
        prefix = v[:8] if len(v) > 12 else v[:4]
        return f"{prefix}...****"

    model_config = {"from_attributes": True}
