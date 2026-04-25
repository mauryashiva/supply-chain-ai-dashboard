from pydantic import BaseModel, ConfigDict
from typing import List

class AppSetting(BaseModel):
    setting_key: str
    setting_value: str
    model_config = ConfigDict(from_attributes=True)

class AppSettingsUpdate(BaseModel):
    settings: List[AppSetting]