import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base


class EvaluationRequest(Base):
    """An asset owner's request for an ecological evaluation of a specific asset.

    Stores the full questionnaire responses as JSON so the shape can evolve
    without requiring schema migrations.
    """

    __tablename__ = "evaluation_requests"

    evaluation_request_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    farm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("farms.farm_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    responses = Column(JSON, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending / scheduled / completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
