from sqlalchemy import Column, String
from ...database import Base

class AppSettings(Base):
    """
    Model for global application configurations.
    Stored as Key-Value pairs for maximum flexibility.
    Example: 'LOW_STOCK_THRESHOLD' -> '15'
    """
    __tablename__ = 'app_settings'

    # The unique identifier for the setting (e.g., 'THEME', 'THRESHOLD')
    setting_key = Column(String, primary_key=True, index=True)
    
    # The value is stored as a string and casted in the logic layer/helpers
    setting_value = Column(String, nullable=False)

    def __repr__(self):
        return f"<AppSettings(key={self.setting_key}, value={self.setting_value})>"