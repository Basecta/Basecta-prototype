"""
Shared test fixtures.

Uses an in-memory SQLite database so tests run fast and don't touch
the real PostgreSQL instance.  A fresh database is created for every
test function so they stay fully isolated.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.database import Base, get_db

# ── Import every model so Base.metadata is complete ────────────────────────────
from app.models import user as _u                          # noqa: F401
from app.models import staff_user as _su                   # noqa: F401
from app.models import refresh_token as _rt                # noqa: F401
from app.models import staff_refresh_token as _srt         # noqa: F401
from app.models import password_reset_token as _prt        # noqa: F401
from app.models import pending_verification as _pv         # noqa: F401
from app.models import notification as _n                  # noqa: F401
from app.models import staff_notification as _sn           # noqa: F401
from app.models import survey as _s                        # noqa: F401
from app.models import dashboard as _d                     # noqa: F401
from app.models import evaluation_request as _er           # noqa: F401

# ── Patch PG UUID to work with SQLite ──────────────────────────────────────────
# PostgreSQL UUID columns need to be rendered as plain strings in SQLite.
# We monkey-patch the dialect-level compilation so every UUID(as_uuid=True)
# column stores/retrieves plain VARCHAR(36) values in SQLite.
import sqlalchemy.dialects.sqlite.base as _sqlite_dialect

_orig_visit = _sqlite_dialect.SQLiteTypeCompiler.visit_UUID


def _visit_uuid_as_varchar(self, type_, **kw):
    return "VARCHAR(36)"


_sqlite_dialect.SQLiteTypeCompiler.visit_UUID = _visit_uuid_as_varchar

# Also make the PG UUID type pass strings through without trying .hex
_orig_bind_processor = PG_UUID.bind_processor


def _uuid_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        def process(value):
            if value is not None:
                return str(value)
            return value
        return process
    return _orig_bind_processor(self, dialect)


PG_UUID.bind_processor = _uuid_bind_processor

_orig_result_processor = PG_UUID.result_processor


def _uuid_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        import uuid as _uuid
        def process(value):
            if value is not None:
                return _uuid.UUID(str(value)) if self.as_uuid else str(value)
            return value
        return process
    return _orig_result_processor(self, dialect, coltype)


PG_UUID.result_processor = _uuid_result_processor

# ── In-memory SQLite engine ────────────────────────────────────────────────────
# SQLite doesn't enforce FKs by default; enable them per-connection.
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def db():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    """FastAPI TestClient wired to the per-test SQLite session."""
    # Avoid importing app at module level — it runs the PG trigger SQL.
    # Instead, build a minimal app from the routers.
    from fastapi import FastAPI
    from app.api import auth, dashboard, survey, notifications, staff_auth, staff_notifications

    app = FastAPI()
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    app.include_router(survey.router)
    app.include_router(notifications.router)
    app.include_router(staff_auth.router)
    app.include_router(staff_notifications.router)

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c


# ── Helper: create a user directly in the DB and return an access token ────────

from app.utils.security import hash_password, create_access_token
from app.models.user import User
from app.models.staff_user import StaffUser


@pytest.fixture()
def user_and_token(db):
    """Create a regular user and return (user, access_token)."""
    u = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("Test1234!"),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token(data={"sub": u.email, "user_id": str(u.user_id)})
    return u, token


@pytest.fixture()
def auth_header(user_and_token):
    """Authorization header dict for a regular user."""
    _, token = user_and_token
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_and_token(db):
    """Create an admin staff user and return (staff, access_token)."""
    s = StaffUser(
        email="admin@basecta.com",
        full_name="Admin User",
        hashed_password=hash_password("Admin1234!"),
        role="admin",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    token = create_access_token(
        data={"sub": s.email, "staff_id": str(s.staff_id), "role": s.role}
    )
    return s, token


@pytest.fixture()
def staff_auth_header(admin_and_token):
    """Authorization header dict for an admin staff user."""
    _, token = admin_and_token
    return {"Authorization": f"Bearer {token}"}
