from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from datetime import datetime
from app.database import Base


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    responses = Column(JSON, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
