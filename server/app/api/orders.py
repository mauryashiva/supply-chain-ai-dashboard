from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

def _update_product_status(product: models.Product):
    """Updates the product's status based on its stock quantity."""
    LOW_STOCK_THRESHOLD = 10

    if product.stock_quantity <= 0:
        product.stock_quantity = 0
        product.status = models.StockStatus.Out_of_Stock
    elif product.stock_quantity <= LOW_STOCK_THRESHOLD:
        product.status = models.StockStatus.Low_Stock
    else:
        product.status = models.StockStatus.In_Stock

@router.get("/", response_model=List[schemas.Order])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.items)
            .joinedload(models.OrderItem.product)
        )
        .order_by(models.Order.order_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders

@router.post("/", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    order_data = order.model_dump(exclude={"items"})
    db_order = models.Order(**order_data)
    
    if not order.items:
        raise HTTPException(status_code=400, detail="An order must contain at least one item.")

    for item_data in order.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item_data.product_id} not found.")
        
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for {product.name}. Available: {product.stock_quantity}, Requested: {item_data.quantity}"
            )
            
        product.stock_quantity -= item_data.quantity
        _update_product_status(product)
        
        order_item = models.OrderItem(
            product_id=product.id, 
            quantity=item_data.quantity
        )
        db_order.items.append(order_item)

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.put("/{order_id}", response_model=schemas.Order)
def update_order(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.id == order_id).first()
    
    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    original_status = db_order.status
    
    update_data = order_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    new_status = db_order.status
    restock_statuses = [models.OrderStatus.Cancelled, models.OrderStatus.Returned]

    # CASE 1: Agar order 'Cancelled' ya 'Returned' ho raha hai
    if new_status in restock_statuses and original_status not in restock_statuses:
        for item in db_order.items:
            item.product.stock_quantity += item.quantity
            _update_product_status(item.product)
            print(f"Restocked {item.quantity} of {item.product.name}.")
    
    # --- NEW LOGIC: AGAR ORDER 'RETURNED' SE WAPAS NORMAL HO RAHA HAI ---
    # CASE 2: Agar order pehle 'Cancelled'/'Returned' tha, lekin ab nahi hai
    elif original_status in restock_statuses and new_status not in restock_statuses:
        for item in db_order.items:
            # Stock wapas kam karne se pehle check karein ki stock available hai ya nahi
            if item.product.stock_quantity < item.quantity:
                # Agar stock nahi hai, to transaction ko fail kar dein
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reverse return for {item.product.name}. Not enough stock available."
                )
            # Stock wapas kam karein
            item.product.stock_quantity -= item.quantity
            _update_product_status(item.product)
            print(f"De-stocked {item.quantity} of {item.product.name} after reversing return.")

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    db.delete(db_order)
    db.commit()
    return None