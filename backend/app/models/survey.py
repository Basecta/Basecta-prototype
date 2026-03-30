from sqlalchemy import Column, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    responses = Column(JSON, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
