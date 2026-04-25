from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# =========================
# DATABASE ENGINE
# =========================
# Standardizing connection string for SQLAlchemy (handling 'postgres://' vs 'postgresql://')
database_url = settings.DATABASE_URL
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    database_url,
    # Standard production optimizations
    pool_pre_ping=True,      # Checks if connection is alive before using it
    pool_size=10,            # Higher baseline for multiple concurrent admin/customer requests
    max_overflow=20,         # Allow burst traffic
    pool_timeout=30,         # Wait 30s for a connection before failing
    pool_recycle=1800,       # Reset connection every 30 mins to avoid stale DB timeouts
)

# =========================
# SESSION FACTORY
# =========================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =========================
# BASE MODEL
# =========================
# All modular models (admin, customer, shared) must inherit from THIS Base
Base = declarative_base()

# =========================
# FASTAPI DEPENDENCY
# =========================
def get_db():
    """
    Generator that provides a database session for a single request
    and ensures it is properly closed once the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================
# INITIALIZATION LOG
# =========================
print(f"📡 Database engine mapped to: {database_url.split('@')[-1] if database_url else 'No URL set'}")
print("✅ Database orchestration layer ready.")