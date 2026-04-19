import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jd_id      = Column(UUID(as_uuid=True), ForeignKey("jds.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    broad      = Column(Text)      # widest net
    targeted   = Column(Text)      # balanced (primary display)
    strict     = Column(Text)      # exact match
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
