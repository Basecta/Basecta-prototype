from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.models import survey as _survey_models        # noqa: F401
from app.models import dashboard as _dashboard_models  # noqa: F401
from app.models import notification as _notification_models  # noqa: F401
from app.api import auth, upload, survey, dashboard, notifications

# Create database tables
Base.metadata.create_all(bind=engine)

# PostgreSQL trigger: whenever a row is inserted into `farms`, automatically
# create a matching row in `farm_dashboards` with dashboard_name = farm name.
# CREATE OR REPLACE makes this idempotent on every restart.
_TRIGGER_SQL = """
CREATE OR REPLACE FUNCTION fn_create_farm_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO farm_dashboards (farm_id, farm_dashboard_name)
    VALUES (NEW.farm_id, NEW.farm_name)
    ON CONFLICT (farm_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_farm_dashboard ON farms;

CREATE TRIGGER trg_create_farm_dashboard
AFTER INSERT ON farms
FOR EACH ROW EXECUTE FUNCTION fn_create_farm_dashboard();
"""

with engine.connect() as conn:
    conn.execute(text(_TRIGGER_SQL))
    conn.commit()

app = FastAPI(title="Biodiversity Farm API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(survey.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"message": "Basecta API"}