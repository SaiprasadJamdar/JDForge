import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    jd_id        = Column(UUID(as_uuid=True), ForeignKey("jds.id", ondelete="CASCADE"), nullable=True)
    type         = Column(String(50), nullable=False) # 'jd_invite', 'system'
    status       = Column(String(20), default="pending") # 'pending', 'accepted', 'declined', 'seen'
    message      = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
