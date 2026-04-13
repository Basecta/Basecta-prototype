from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from dotenv import load_dotenv
import os

# Load .env so DATABASE_URL is available (same source of truth as the app).
load_dotenv()

config = context.config

# Override the ini-file URL with the real DATABASE_URL from the environment.
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import every model so Base.metadata knows about all tables ───────────────
from app.database import Base
from app.models import user as _user                                    # noqa: F401
from app.models import staff_user as _staff_user                        # noqa: F401
from app.models import refresh_token as _refresh_token                  # noqa: F401
from app.models import staff_refresh_token as _staff_refresh_token      # noqa: F401
from app.models import password_reset_token as _password_reset_token    # noqa: F401
from app.models import pending_verification as _pending_verification    # noqa: F401
from app.models import notification as _notification                    # noqa: F401
from app.models import staff_notification as _staff_notification        # noqa: F401
from app.models import survey as _survey                                # noqa: F401
from app.models import dashboard as _dashboard                          # noqa: F401
from app.models import evaluation_request as _evaluation_request        # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
