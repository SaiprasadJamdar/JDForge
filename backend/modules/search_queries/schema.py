from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SearchQueryOut(BaseModel):
    id: UUID
    jd_id: UUID
    broad: Optional[str]
    targeted: Optional[str]
    strict: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
