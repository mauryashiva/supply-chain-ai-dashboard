import time
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Import the settings (which include DATABASE_URL)
from .config import settings

def connect_with_retry():
    """
    Attempts to connect to the database with a retry mechanism.
    This is useful for docker-compose startup sequences.
    """
    retries = 5
    delay = 2
    for attempt in range(retries):
        try:
            # Try to create an engine and establish a connection
            engine = create_engine(settings.DATABASE_URL)
            connection = engine.connect()
            connection.close()
            print("✅ Database connection successful!")
            return engine
        except OperationalError:
            # If connection fails (e.g., DB not ready), wait and retry
            print(f"Database connection failed. Attempt {attempt + 1} of {retries}.")
            if attempt < retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                # If all retries fail, print error and raise the exception
                print("❌ Could not connect to the database after several retries.")
                raise

# --- Database Setup ---
# Create the SQLAlchemy engine using the retry logic
engine = connect_with_retry()

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for our models to inherit from
Base = declarative_base()

# --- Dependency ---
def get_db():
    """
    FastAPI dependency to create and manage a database session
    for each incoming request.
    """
    db = SessionLocal()
    try:
        yield db  # Provide the session to the request
    finally:
        db.close() # Ensure the session is closed after the request is finished