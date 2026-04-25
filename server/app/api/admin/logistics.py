from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

# Updated relative imports to move up two levels
from ...database import get_db
from ...schemas.admin import logistics as logistics_schemas
from ...models.admin import logistics as logistics_models
from ..auth import get_current_user

# The router remains protected by admin authentication
router = APIRouter(dependencies=[Depends(get_current_user)])

# 🔥 FIXED: Changed "/" to "/vehicles" to match the frontend service call
@router.get("/vehicles", response_model=List[logistics_schemas.Vehicle])
def get_all_vehicles(db: Session = Depends(get_db)):
    """
    Fetches a list of all fleet vehicles from the database for the logistics map.
    Maps to: GET /api/admin/logistics/vehicles
    """
    # Use the admin-specific logistics model
    vehicles = db.query(logistics_models.Vehicle).all()
    return vehicles