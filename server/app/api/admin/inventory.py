from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ...database import get_db
from ...schemas.admin import inventory as inventory_schemas
from ...models.admin import inventory as inventory_models
from ..auth import get_current_user
from ...utils.settings_helpers import get_low_stock_threshold, get_product_status
from ...core.websocket_manager import manager 

router = APIRouter(dependencies=[Depends(get_current_user)])

# ================================
# 1. GET ALL PRODUCTS
# ================================
# CHANGED: Added "/products" to match frontend call
@router.get("/products", response_model=List[inventory_schemas.Product])
def get_all_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches all inventory products.
    Maps to: GET /api/admin/inventory/products
    """
    threshold = get_low_stock_threshold(db)

    products = db.query(inventory_models.Product).options(
        joinedload(inventory_models.Product.images)
    ).order_by(inventory_models.Product.name).offset(skip).limit(limit).all()

    for product in products:
        product.status = get_product_status(product.stock_quantity, threshold)

    return products

# ================================
# 2. CREATE NEW PRODUCT
# ================================
# CHANGED: Added "/products" to match frontend call
@router.post("/products", response_model=inventory_schemas.Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: inventory_schemas.ProductCreate, 
    db: Session = Depends(get_db)
):
    existing = db.query(inventory_models.Product).filter(
        inventory_models.Product.sku == product_in.sku
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{product_in.sku}' already exists.")

    data = product_in.model_dump(exclude={"images"})
    db_product = inventory_models.Product(**data)

    if product_in.images:
        for img in product_in.images:
            new_img = inventory_models.ProductImage(**img.model_dump())
            db_product.images.append(new_img)

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    db_product.status = get_product_status(db_product.stock_quantity, get_low_stock_threshold(db))
    await manager.broadcast("inventory_updated")
    return db_product

# ================================
# 3. UPDATE PRODUCT
# ================================
# CHANGED: Added "/products" to match frontend call
@router.put("/products/{product_id}", response_model=inventory_schemas.Product)
async def update_product(
    product_id: int, 
    update_in: inventory_schemas.ProductUpdate, 
    db: Session = Depends(get_db)
):
    db_product = db.query(inventory_models.Product).options(
        joinedload(inventory_models.Product.images)
    ).filter(inventory_models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = update_in.model_dump(exclude_unset=True)

    if 'images' in update_data:
        db_product.images.clear()
        if update_data['images']:
            for img_dict in update_data['images']:
                db_product.images.append(inventory_models.ProductImage(**img_dict))
        del update_data['images']

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    db_product.status = get_product_status(db_product.stock_quantity, get_low_stock_threshold(db))
    await manager.broadcast("inventory_updated")
    return db_product

# ================================
# 4. DELETE PRODUCT
# ================================
# CHANGED: Added "/products" to match frontend call
@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(inventory_models.Product).filter(
        inventory_models.Product.id == product_id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    
    await manager.broadcast("inventory_updated")
    return None