from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

# --- SETTINGS API ENDPOINTS ---

@router.get("/", response_model=List[schemas.AppSetting])
def get_all_settings(db: Session = Depends(get_db)):
    """
    Database se saari app settings fetch karta hai.
    """
    settings = db.query(models.AppSettings).all()
    
    # Agar koi setting nahi hai, to ek default setting bana dein
    if not settings:
        default_setting = models.AppSettings(
            setting_key="LOW_STOCK_THRESHOLD",
            setting_value="10"
        )
        db.add(default_setting)
        db.commit()
        db.refresh(default_setting)
        return [default_setting]
        
    return settings

@router.put("/", response_model=List[schemas.AppSetting])
def update_settings(payload: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    """
    Ek saath multiple settings ko update ya create karta hai (upsert).
    """
    updated_settings_keys = []
    for setting_data in payload.settings:
        # Database mein uss key ki setting dhoondhein
        db_setting = db.query(models.AppSettings).filter(
            models.AppSettings.setting_key == setting_data.setting_key
        ).first()
        
        if db_setting:
            # Agar setting pehle se hai, to uski value update karein
            db_setting.setting_value = setting_data.setting_value
        else:
            # Agar setting nahi hai, to nayi setting banayein
            db_setting = models.AppSettings(**setting_data.model_dump())
            db.add(db_setting)
        
        updated_settings_keys.append(setting_data.setting_key)

    db.commit()
    
    # Updated settings ko database se refresh karke return karein
    updated_settings = db.query(models.AppSettings).filter(
        models.AppSettings.setting_key.in_(updated_settings_keys)
    ).all()

    return updated_settings