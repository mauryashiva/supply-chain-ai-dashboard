from sqlalchemy.orm import Session
# Modular Imports
from ..models.admin import settings as settings_models
from ..models.admin import inventory as inventory_models
from ..schemas.admin import inventory as inventory_schemas

# --- Central helper functions for application settings ---

def get_low_stock_threshold(db: Session) -> int:
    """
    Fetches the 'LOW_STOCK_THRESHOLD' setting from the database.
    Returns 10 as a default if the setting is not found or is invalid.
    """
    setting = db.query(settings_models.AppSettings).filter(
        settings_models.AppSettings.setting_key == "LOW_STOCK_THRESHOLD"
    ).first()
    
    # Check if setting exists and its value is a valid integer string
    if setting and setting.setting_value.isdigit():
        return int(setting.setting_value)
    
    return 10  # Default value fallback

def get_product_status(stock_quantity: int, low_stock_threshold: int) -> inventory_schemas.StockStatus:
    """
    Calculates the correct StockStatus enum based on current stock level and threshold.
    This is a pure logic helper used for response formatting.
    """
    if stock_quantity <= 0:
        return inventory_schemas.StockStatus.Out_of_Stock
    elif stock_quantity <= low_stock_threshold:
        return inventory_schemas.StockStatus.Low_Stock
    else:
        return inventory_schemas.StockStatus.In_Stock

def update_product_status_dynamically(product: inventory_models.Product, db: Session):
    """
    Dynamically attaches the 'status' attribute to a product object.
    Note: 'status' is not a database column; it is a dynamic property 
    required by the Pydantic response schemas.
    """
    threshold = get_low_stock_threshold(db)
    
    # Ensure stock isn't negative for business logic consistency
    if product.stock_quantity < 0:
        product.stock_quantity = 0 
        
    # Calculate and attach the status attribute
    product.status = get_product_status(product.stock_quantity, threshold)