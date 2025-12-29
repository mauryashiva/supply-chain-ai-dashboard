from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db  # Import the database session dependency
from ..schemas import schemas  # Import Pydantic schemas
from ..models import models   # Import SQLAlchemy models

router = APIRouter()

@router.get("/vehicles", response_model=List[schemas.Vehicle])
def get_all_vehicles(db: Session = Depends(get_db)):
    """
    Fetches a list of all vehicles from the database.
    """
    vehicles = db.query(models.Vehicle).all()
    return vehicles