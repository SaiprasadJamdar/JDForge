from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,      # reconnects stale connections automatically
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All ORM models inherit from this single Base."""
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Called once on startup to ensure all tables exist."""
    # Import all models here so SQLAlchemy registers them before create_all
    import backend.modules.auth.model        # noqa: F401
    import backend.modules.auth.otp_model    # noqa: F401  ← OTP records
    import backend.modules.transcripts.model # noqa: F401
    import backend.modules.jd.model          # noqa: F401
    import backend.modules.search_queries.model # noqa: F401
    import backend.modules.candidates.model  # noqa: F401
    import backend.modules.notifications.model # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Idempotent column migrations — safe to re-run on every startup.
    # Add any columns here that may be missing from pre-existing tables.
    _migrations = [
        "ALTER TABLE candidate_results ADD COLUMN IF NOT EXISTS explanation TEXT",
        "ALTER TABLE candidate_results ADD COLUMN IF NOT EXISTS score_breakdown JSONB",
        "ALTER TABLE candidate_results ADD COLUMN IF NOT EXISTS matched_skills TEXT[]",
        "ALTER TABLE candidate_results ADD COLUMN IF NOT EXISTS missing_skills TEXT[]",
    ]
    from sqlalchemy import text
    with engine.connect() as conn:
        for stmt in _migrations:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Migration skipped ({e}): {stmt}")
        conn.commit()
