from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models
# Import helpers to dynamically calculate product status based on settings
from ..utils.settings_helpers import get_low_stock_threshold, get_product_status
from ..core.websocket_manager import manager  # WebSocket manager


router = APIRouter()

@router.get("/products", response_model=List[schemas.Product])
def get_all_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches all products, dynamically calculating their status.
    """
    # Get the current low stock threshold from the database settings
    low_stock_threshold = get_low_stock_threshold(db)

    # Fetch products and eager-load their images to prevent N+1 query problems
    products_from_db = db.query(models.Product).options(
        joinedload(models.Product.images)
    ).order_by(models.Product.name).offset(skip).limit(limit).all()

    # List to hold products with their status calculated
    products_with_status = []
    for product in products_from_db:
        # Calculate status dynamically based on stock and threshold
        calculated_status = get_product_status(product.stock_quantity, low_stock_threshold)
        
        # Set the calculated status on the object for the response
        # This does NOT save to the database, it's only for the Pydantic model
        product.status = calculated_status
        products_with_status.append(product)

    return products_with_status

@router.post("/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
async def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """
    Creates a new product in the database.
    The 'status' field is dynamically calculated upon creation.
    """
    # Check if a product with the same SKU already exists
    db_product_check = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )

    # Exclude images from the main model dump, as they are a related model
    product_data = product.model_dump(exclude={"images"})
    db_product = models.Product(**product_data)

    # If image data is present in the request, create ProductImage objects
    if product.images:
        for img_data in product.images:
            new_image = models.ProductImage(**img_data.model_dump())
            db_product.images.append(new_image)

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # For the response, dynamically calculate and set the status
    low_stock_threshold = get_low_stock_threshold(db)
    calculated_status = get_product_status(db_product.stock_quantity, low_stock_threshold)
    setattr(db_product, 'status', calculated_status) # Assign the status for the response model

    print(f"✅ New product created via API: {db_product.name} (SKU: {db_product.sku})")
        # WebSocket Broadcast
    await manager.broadcast("inventory_updated")
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
async def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing product.
    The 'status' field is dynamically recalculated after the update.
    """
    # Fetch the product and its images
    db_product = db.query(models.Product).options(joinedload(models.Product.images)).filter(models.Product.id == product_id).first()

    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Get update data, excluding fields that weren't set in the request
    update_data = product_update.model_dump(exclude_unset=True)

    # Handle image updates: This replaces the entire set of images
    if 'images' in update_data:
        # Clear the existing image relationship
        db_product.images.clear()
        # Add the new images from the request
        for img_data_dict in update_data['images']:
            new_image = models.ProductImage(**img_data_dict)
            db_product.images.append(new_image)
        # Remove 'images' from update_data so it's not processed by the loop below
        del update_data['images']

    # Update all other fields provided in the request
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # For the response, dynamically calculate and set the new status
    low_stock_threshold = get_low_stock_threshold(db)
    calculated_status = get_product_status(db_product.stock_quantity, low_stock_threshold)
    setattr(db_product, 'status', calculated_status) # Assign the status for the response model

        # WebSocket Broadcast
    await manager.broadcast("inventory_updated")

    return db_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Deletes a product from the database.
    """
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
     # WebSocket Broadcast
    await manager.broadcast("inventory_updated")
    return None