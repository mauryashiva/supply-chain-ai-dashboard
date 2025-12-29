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
    Fetches all app settings from the database.
    """
    settings = db.query(models.AppSettings).all()
    
    # If no settings are found, create a default setting
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
    Updates or creates (upserts) multiple settings at once.
    """
    updated_settings_keys = []
    for setting_data in payload.settings:
        # Find the setting in the database by its key
        db_setting = db.query(models.AppSettings).filter(
            models.AppSettings.setting_key == setting_data.setting_key
        ).first()
        
        if db_setting:
            # If the setting exists, update its value
            db_setting.setting_value = setting_data.setting_value
        else:
            # If the setting does not exist, create a new one
            db_setting = models.AppSettings(**setting_data.model_dump())
            db.add(db_setting)
        
        updated_settings_keys.append(setting_data.setting_key)

    db.commit()
    
    # Return the refreshed settings from the database
    updated_settings = db.query(models.AppSettings).filter(
        models.AppSettings.setting_key.in_(updated_settings_keys)
    ).all()

    return updated_settings