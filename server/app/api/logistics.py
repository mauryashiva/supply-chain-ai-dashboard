from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models

# --- CHANGE 1: Naya "Security Guard" import karein ---
from ..auth_deps import get_current_user_claims

router = APIRouter()

@router.get("/vehicles", response_model=List[schemas.Vehicle])
def get_all_vehicles(
    db: Session = Depends(get_db),
    # --- CHANGE 2: Endpoint ko secure karein ---
    user_claims: dict = Depends(get_current_user_claims)
):
    vehicles = db.query(models.Vehicle).all()
    return vehicles