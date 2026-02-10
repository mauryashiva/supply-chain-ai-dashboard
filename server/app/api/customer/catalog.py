from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from ...database import get_db
from ...models import models
from ...schemas import schemas
from ...schemas.schemas import StockStatus  # import enum

router = APIRouter()


@router.get("/products", response_model=List[schemas.Product])
def get_storefront_products(db: Session = Depends(get_db)):

    products = (
        db.query(models.Product)
        .options(joinedload(models.Product.images))
        .filter(models.Product.stock_quantity > 0)
        .all()
    )

    # 🔥 ADD STATUS MANUALLY
    result = []
    for product in products:
        if product.stock_quantity <= 0:
            status = StockStatus.Out_of_Stock
        elif product.reorder_level and product.stock_quantity <= product.reorder_level:
            status = StockStatus.Low_Stock
        else:
            status = StockStatus.In_Stock

        product.status = status  # 👈 attach dynamically
        result.append(product)

    return result