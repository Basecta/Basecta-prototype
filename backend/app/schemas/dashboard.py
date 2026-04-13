from uuid import UUID
from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field


class FarmOut(BaseModel):
    farm_id: UUID
    user_id: UUID
    farm_name: str
    farm_dashboard_name: str
    location: str
    nature_credits: float
    income: float
    reliability_score: float

    # Description fields (all optional — newly added)
    asset_type: str | None = None
    size_hectares: float | None = None
    region: str | None = None
    description: str | None = None

    # Whether an evaluation request has already been submitted for this asset
    has_evaluation_request: bool = False

    model_config = {"from_attributes": True}


class FarmCreate(BaseModel):
    farm_name: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., min_length=1, max_length=500)
    asset_type: str | None = Field(None, max_length=100)
    size_hectares: float | None = Field(None, ge=0)
    region: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=5000)


class FarmUpdate(BaseModel):
    """Fields editable from the asset overview → edit tab. All optional."""
    farm_name: str | None = Field(None, min_length=1, max_length=200)
    location: str | None = Field(None, min_length=1, max_length=500)
    asset_type: str | None = Field(None, max_length=100)
    size_hectares: float | None = Field(None, ge=0)
    region: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=5000)


class ManagerDashboardOut(BaseModel):
    manager_dashboard_id: UUID
    user_id: UUID
    manager_dashboard_name: str
    farm_ids: list[UUID]
    total_nature_credits: float
    total_income: float
    avg_reliability: float

    model_config = {"from_attributes": True}


class EvaluationRequestCreate(BaseModel):
    responses: dict[str, Any]


class EvaluationRequestOut(BaseModel):
    evaluation_request_id: UUID
    farm_id: UUID
    user_id: UUID
    responses: dict[str, Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
