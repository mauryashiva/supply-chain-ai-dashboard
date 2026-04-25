from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

# Updated Modular Imports
from ...database import get_db
# Import from the specific admin/inventory domain
from ...models.admin import inventory as inventory_models
from ...schemas.admin import inventory as inventory_schemas

router = APIRouter()

# ================================
# 1. GET ALL PRODUCTS
# ================================
@router.get("/products", response_model=List[inventory_schemas.Product])
def get_storefront_products(db: Session = Depends(get_db)):
    """
    Fetches all available products for the customer storefront.
    Only shows products currently in stock.
    """
    products = (
        db.query(inventory_models.Product)
        .options(joinedload(inventory_models.Product.images))
        .filter(inventory_models.Product.stock_quantity > 0)
        .all()
    )

    result = []
    for product in products:
        # Reusable Status Logic
        if product.stock_quantity <= 0:
            status = inventory_schemas.StockStatus.Out_of_Stock
        elif product.reorder_level and product.stock_quantity <= product.reorder_level:
            status = inventory_schemas.StockStatus.Low_Stock
        else:
            status = inventory_schemas.StockStatus.In_Stock

        product.status = status
        result.append(product)

    return result

# ================================
# 2. GET SINGLE PRODUCT DETAILS
# ================================
@router.get("/products/{product_id}", response_model=inventory_schemas.Product)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    """
    Fetches detailed information for a single product.
    """
    # Fetch product with images using modular admin models
    product = (
        db.query(inventory_models.Product)
        .options(joinedload(inventory_models.Product.images))
        .filter(inventory_models.Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ATTACH STATUS MANUALLY (Matches Storefront Logic)
    if product.stock_quantity <= 0:
        product.status = inventory_schemas.StockStatus.Out_of_Stock
    elif product.reorder_level and product.stock_quantity <= product.reorder_level:
        product.status = inventory_schemas.StockStatus.Low_Stock
    else:
        product.status = inventory_schemas.StockStatus.In_Stock

    return product