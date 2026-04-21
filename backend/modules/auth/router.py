import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.core.email_service import send_otp_email
from backend.database import get_db
from backend.dependencies import create_access_token, get_current_user
from backend.modules.auth.model import User, TokenLog
from backend.modules.auth.otp_model import OTPRecord
from backend.modules.auth.schema import (
    ForgotPasswordRequest, PasswordResetRequest, VerifyOTPRequest,
    PasswordUpdate, TokenResponse, UserKeysUpdate, UserOut, UserRegister,
)
from backend.modules.auth.service import (
    authenticate_user, create_user, get_user_by_email, hash_password, update_user_password, verify_password,
)
from backend.core.security import encrypt_key

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    return create_user(db, payload.name, payload.email, payload.password)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/password", status_code=status.HTTP_200_OK)
def update_password(payload: PasswordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    update_user_password(db, current_user, payload.new_password)
    return {"message": "Password updated successfully"}


@router.patch("/keys", response_model=UserOut)
def update_keys(payload: UserKeysUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.groq_api_key is not None:
        current_user.groq_api_key = encrypt_key(payload.groq_api_key)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/logs")
def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve token usage history for the current user."""
    logs = db.query(TokenLog).filter(TokenLog.user_id == current_user.id).order_by(TokenLog.created_at.desc()).limit(100).all()
    return logs


# ─── Forgot Password / OTP Flow ───────────────────────────────────────────────

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP, persist its bcrypt hash, and email it."""
    settings = get_settings()
    # Always return 200 — don't reveal whether email exists
    user = get_user_by_email(db, payload.email)
    if not user:
        print(f"[AUTH] Forget password request for UNREGISTERED email: {payload.email}")
        return {"message": "If the email is registered, an OTP has been sent."}

    # Invalidate any prior OTPs for this email
    db.query(OTPRecord).filter(
        OTPRecord.email == payload.email, OTPRecord.used == False
    ).update({"used": True})

    otp_code = str(random.randint(100000, 999999))
    otp_hashed = hash_password(otp_code)   # reuse bcrypt from service
    record = OTPRecord(email=payload.email, otp_hash=otp_hashed)
    db.add(record)
    db.commit()

    print(f"\n[AUTH] OTP generated for {payload.email}: {otp_code}\n")
    send_otp_email(payload.email, otp_code)   # best-effort
    return {"message": "If the email is registered, an OTP has been sent."}


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the 6-digit OTP — marks it as used so it can't be replayed."""
    settings = get_settings()
    expiry = datetime.utcnow() - timedelta(minutes=settings.otp_expire_minutes)

    record: OTPRecord | None = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.email == payload.email,
            OTPRecord.used == False,
            OTPRecord.created_at >= expiry,
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )
    if not record or not verify_password(payload.otp, record.otp_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    return {"message": "OTP verified"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """Verify OTP one final time and reset the password (OTP consumed here)."""
    settings = get_settings()
    expiry = datetime.utcnow() - timedelta(minutes=settings.otp_expire_minutes)

    record: OTPRecord | None = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.email == payload.email,
            OTPRecord.used == False,
            OTPRecord.created_at >= expiry,
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )
    if not record or not verify_password(payload.otp, record.otp_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Consume OTP
    record.used = True
    update_user_password(db, user, payload.new_password)
    return {"message": "Password reset successfully"}
