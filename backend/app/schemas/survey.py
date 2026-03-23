from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime


class SurveyCreate(BaseModel):
    responses: Dict[str, Any]


class SurveyResponseOut(BaseModel):
    user_id: int
    responses: Dict[str, Any]
    completed_at: datetime

    class Config:
        from_attributes = True
