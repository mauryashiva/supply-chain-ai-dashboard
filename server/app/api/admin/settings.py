from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Updated relative imports to jump two levels to reach app root
from ...database import get_db
from ...schemas.admin import settings as settings_schemas
from ...models.admin import settings as settings_models
from ..auth import get_current_user

# Router remains protected by admin authentication
router = APIRouter(dependencies=[Depends(get_current_user)])

# --- SETTINGS API ENDPOINTS ---

@router.get("/", response_model=List[settings_schemas.AppSetting])
def get_all_settings(db: Session = Depends(get_db)):
    """
    Fetches all application configurations. If none exist, initializes a default 
    LOW_STOCK_THRESHOLD setting.
    """
    # Use modular admin models
    settings = db.query(settings_models.AppSettings).all()
    
    if not settings:
        default_setting = settings_models.AppSettings(
            setting_key="LOW_STOCK_THRESHOLD",
            setting_value="10"
        )
        db.add(default_setting)
        db.commit()
        db.refresh(default_setting)
        return [default_setting]
        
    return settings

@router.put("/", response_model=List[settings_schemas.AppSetting])
def update_settings(
    payload: settings_schemas.AppSettingsUpdate, 
    db: Session = Depends(get_db)
):
    """
    Handles bulk updates or creation (upserts) for system settings.
    """
    updated_keys = []
    for setting_data in payload.settings:
        # Search using the admin-specific settings model
        db_setting = db.query(settings_models.AppSettings).filter(
            settings_models.AppSettings.setting_key == setting_data.setting_key
        ).first()
        
        if db_setting:
            db_setting.setting_value = setting_data.setting_value
        else:
            # Create new if it doesn't exist
            db_setting = settings_models.AppSettings(**setting_data.model_dump())
            db.add(db_setting)
        
        updated_keys.append(setting_data.setting_key)

    db.commit()
    
    # Return refreshed data
    return db.query(settings_models.AppSettings).filter(
        settings_models.AppSettings.setting_key.in_(updated_keys)
    ).all()