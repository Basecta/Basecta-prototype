from uuid import UUID
from typing import List
from pydantic import BaseModel


class FarmOut(BaseModel):
    farm_id: UUID
    user_id: UUID
    farm_name: str
    farm_dashboard_name: str
    location: str
    nature_credits: float
    income: float
    reliability_score: float

    model_config = {"from_attributes": True}


class ManagerDashboardOut(BaseModel):
    manager_dashboard_id: UUID
    user_id: UUID
    manager_dashboard_name: str
    farm_ids: List[UUID]
    total_nature_credits: float
    total_income: float
    avg_reliability: float

    model_config = {"from_attributes": True}
