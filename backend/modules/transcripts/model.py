import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_filename = Column(String(500))
    source_type     = Column(String(20), nullable=False)  # 'audio' | 'video' | 'text_paste'
    raw_text        = Column(Text, nullable=False)
    clean_text      = Column(Text)
    language_hint   = Column(String(50))
    duration_secs   = Column(Integer)
    status          = Column(String(20), default="raw")   # 'raw' | 'cleaned' | 'processed'
    created_at      = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
