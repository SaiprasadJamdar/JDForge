"""OTP table — stores one-time passwords for password-reset flow."""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class OTPRecord(Base):
    __tablename__ = "otp_records"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), nullable=False, index=True)
    otp_hash   = Column(String(255), nullable=False)   # bcrypt hash of the 6-digit code
    used       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
