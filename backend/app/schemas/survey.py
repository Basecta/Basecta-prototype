from uuid import UUID

from pydantic import BaseModel
from typing import Any
from datetime import datetime


class SurveyCreate(BaseModel):
    responses: dict[str, Any]


class SurveyResponseOut(BaseModel):
    user_id: UUID
    responses: dict[str, Any]
    completed_at: datetime

    class Config:
        from_attributes = True
