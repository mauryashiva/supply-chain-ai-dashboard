from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models
# Import the WebSocket manager to sync inventory changes live
from ..core.websocket_manager import manager 

router = APIRouter()

@router.get("/", response_model=List[schemas.Order])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches all orders with eager-loading for items and products.
    """
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
async def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Creates a new order manually (Admin side), validates stock, and calculates financials.
    """
    if not order.items:
        raise HTTPException(status_code=400, detail="An order must contain at least one item.")

    subtotal = 0
    total_gst = 0
    order_products_details = []

    # Step 1: Validate stock and calculate subtotal
    for item_data in order.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found.")
        
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}."
            )
            
        item_total_price = (product.selling_price or 0.0) * item_data.quantity
        subtotal += item_total_price
        
        order_products_details.append({
            "product_obj": product,
            "quantity": item_data.quantity,
            "item_total_price": item_total_price
        })

    # Step 2: Calculate Discounts
    total_discount = 0
    if order.discount_type and order.discount_value:
        if order.discount_type == schemas.DiscountType.percentage:
            total_discount = subtotal * (order.discount_value / 100)
        else:
            total_discount = min(order.discount_value, subtotal)

    # Step 3: Calculate GST after proportional discount
    for item in order_products_details:
        item_total = item["item_total_price"]
        product_obj = item["product_obj"]
        
        item_discount = (item_total / subtotal * total_discount) if subtotal > 0 else 0
        taxable_value = item_total - item_discount
        total_gst += taxable_value * ((product_obj.gst_rate or 0.0) / 100)

    # Step 4: Final Calculations
    total_amount = (subtotal - total_discount) + total_gst + (order.shipping_charges or 0.0)

    # Step 5: Save the Order
    client_data = order.model_dump(exclude_unset=True, exclude={"items"})
    db_order = models.Order(
        **client_data,
        subtotal=round(subtotal, 2),
        total_gst=round(total_gst, 2),
        total_amount=round(total_amount, 2)
    )

    # Step 6: Link items and deduct stock
    for item in order_products_details:
        product_obj = item["product_obj"]
        quantity = item["quantity"]
        
        order_item = models.OrderItem(quantity=quantity, product=product_obj)
        db_order.items.append(order_item)
        
        product_obj.stock_quantity -= quantity

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Broadcast update to the storefront to show updated stock levels instantly
    await manager.broadcast("inventory_updated")
    
    return db_order

@router.put("/{order_id}", response_model=schemas.Order)
async def update_order(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    """
    Updates order status and automatically restocks items if Cancelled or Returned.
    """
    db_order = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.id == order_id).first()
    
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    original_status = db_order.status
    update_data = order_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    new_status = db_order.status
    restock_statuses = [models.OrderStatus.Cancelled, models.OrderStatus.Returned]

    stock_changed = False

    # Logic to restore stock if the order is cancelled/returned
    if new_status in restock_statuses and original_status not in restock_statuses:
        for item in db_order.items:
            item.product.stock_quantity += item.quantity
        stock_changed = True
    
    # Logic to re-deduct stock if a cancelled order is re-opened
    elif original_status in restock_statuses and new_status not in restock_statuses:
        for item in db_order.items:
            if item.product.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock to reopen order for {item.product.name}")
            item.product.stock_quantity -= item.quantity
        stock_changed = True

    db.commit()
    db.refresh(db_order)
    await manager.broadcast("order_updated")


    # If inventory levels changed, notify all connected storefronts immediately
    if stock_changed:

        await manager.broadcast("inventory_updated")

    
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Removes an order from the database.
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db.delete(db_order)
    db.commit()
    return None