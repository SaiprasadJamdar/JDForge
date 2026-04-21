import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from backend.database import Base


class JD(Base):
    __tablename__ = "jds"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript_id = Column(UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="SET NULL"), nullable=True)
    title         = Column(String(500), nullable=False)
    slug          = Column(String(500), nullable=False)          # e.g. "data_analyst_9722ee"
    status        = Column(String(20), default="draft")          # 'draft' | 'finalized'
    content       = Column(Text, nullable=False)                  # full JD markdown text
    template_used = Column(Text)                                    # reference template or ID

    accent_color  = Column(String(50))                              # hex color

    quality_score = Column(JSONB)                                 # {overall, fidelity, completeness, sections}
    created_at    = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at    = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class JDCollaborator(Base):
    """Junction table for JD collaborators."""
    __tablename__ = "jd_collaborators"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jd_id      = Column(UUID(as_uuid=True), ForeignKey("jds.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
