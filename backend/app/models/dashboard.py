import uuid
from sqlalchemy import Column, Float, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    farm_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    nature_credits = Column(Float, nullable=False)
    income = Column(Float, nullable=False)
    reliability_score = Column(Float, nullable=False)


class FarmDashboard(Base):
    __tablename__ = "farm_dashboards"

    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.farm_id", ondelete="CASCADE"), primary_key=True)
    farm_dashboard_name = Column(String, nullable=False)


class ManagerDashboard(Base):
    __tablename__ = "manager_dashboards"

    manager_dashboard_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    manager_dashboard_name = Column(String, nullable=False)


class ManagerDashboardFarm(Base):
    """Junction table linking manager dashboards to farms."""
    __tablename__ = "manager_dashboard_farms"

    manager_dashboard_id = Column(UUID(as_uuid=True), ForeignKey("manager_dashboards.manager_dashboard_id", ondelete="CASCADE"), primary_key=True)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.farm_id", ondelete="CASCADE"), primary_key=True)
