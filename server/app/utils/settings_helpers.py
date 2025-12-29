# server/app/utils/settings_helpers.py

from sqlalchemy.orm import Session
from ..models import models
from ..schemas import schemas

# --- Central helper functions for application settings ---

def get_low_stock_threshold(db: Session) -> int:
    """
    Fetches the 'LOW_STOCK_THRESHOLD' setting from the database.
    Returns 10 as a default if the setting is not found or is invalid.
    """
    setting = db.query(models.AppSettings).filter(
        models.AppSettings.setting_key == "LOW_STOCK_THRESHOLD"
    ).first()
    # Check if setting exists and its value is a valid integer
    if setting and setting.setting_value.isdigit():
        return int(setting.setting_value)
    return 10  # Default value

def get_product_status(stock_quantity: int, low_stock_threshold: int) -> schemas.StockStatus:
    """
    Calculates the correct StockStatus enum based on stock level and threshold.
    This is a pure helper function and does not modify the database.
    """
    if stock_quantity <= 0:
        return schemas.StockStatus.Out_of_Stock
    elif stock_quantity <= low_stock_threshold:
        return schemas.StockStatus.Low_Stock
    else:
        return schemas.StockStatus.In_Stock

def update_product_status_dynamically(product: models.Product, db: Session):
    """
    (Note: This function attempts to set a 'status' attribute on the DB model,
    which may not exist. Status is typically calculated for the response.)
    Updates a product's status based on the dynamic threshold.
    """
    threshold = get_low_stock_threshold(db)
    
    if product.stock_quantity <= 0:
        product.stock_quantity = 0 # Ensure stock isn't negative
        product.status = models.StockStatus.Out_of_Stock
    elif product.stock_quantity <= threshold:
        product.status = models.StockStatus.Low_Stock
    else:
        product.status = models.StockStatus.In_Stock