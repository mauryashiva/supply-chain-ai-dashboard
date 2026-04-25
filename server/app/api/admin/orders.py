from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from sqlalchemy import func
from datetime import datetime, timezone

# Updated relative imports to move up two levels
from ...database import get_db
from ...schemas.admin import order as order_schemas
from ...models.admin import inventory as inventory_models  # For stock validation
from ...models.admin import order as order_models          # For order tables
from ..auth import get_current_user
from ...core.websocket_manager import manager 

# Router initialization with auth dependency
router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[order_schemas.Order])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches all orders with eager-loading for items and associated products.
    """
    orders = (
        db.query(order_models.Order)
        .options(
            joinedload(order_models.Order.items).joinedload(order_models.OrderItem.product),
            joinedload(order_models.Order.user),
            joinedload(order_models.Order.address) 
        )
        .order_by(order_models.Order.order_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders

@router.post("/", response_model=order_schemas.Order, status_code=status.HTTP_201_CREATED)
async def create_order(order_in: order_schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Manual Admin order creation with stock validation and tax-inclusive calculations.
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain items.")

    subtotal = 0.0
    total_gst = 0.0
    order_items_prepared = []

    # Step 1: Stock Validation & Tax-Inclusive Logic
    for item_data in order_in.items:
        product = db.query(inventory_models.Product).filter(inventory_models.Product.id == item_data.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item_data.product_id} not found.")
        
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}.")
            
        price = product.selling_price or 0.0
        rate = product.gst_rate or 0.0

        # Back-calculate taxable base from inclusive price
        taxable_base = price / (1 + rate / 100)
        gst_amount = price - taxable_base

        subtotal += (taxable_base * item_data.quantity)
        total_gst += (gst_amount * item_data.quantity)
        
        order_items_prepared.append({
            "product": product,
            "quantity": item_data.quantity,
            "unit_price": price,
            "gst_rate": rate,
            "gst_amount": gst_amount * item_data.quantity,
            "taxable_subtotal": taxable_base * item_data.quantity
        })

    # Step 2: Discount Logic
    discount = 0.0
    if order_in.discount_type and order_in.discount_value:
        if order_in.discount_type == "percentage":
            discount = subtotal * (order_in.discount_value / 100)
        else:
            discount = min(order_in.discount_value, subtotal)

    # Step 3: Final Total
    total = (subtotal - discount) + total_gst + (order_in.shipping_charges or 0.0)

    # Step 4: Database Entry
    order_data = order_in.model_dump(exclude_unset=True, exclude={"items"})
    db_order = order_models.Order(
        **order_data,
        order_date=datetime.now(timezone.utc),
        subtotal=round(subtotal, 2),
        total_gst=round(total_gst, 2),
        total_amount=round(total, 2)
    )

    # Step 5: Item Snapshots & Stock Deduction
    for item in order_items_prepared:
        p_obj = item["product"]
        qty = item["quantity"]
        
        db_item = order_models.OrderItem(
            quantity=qty,
            product=p_obj,
            product_name=p_obj.name, 
            product_sku=p_obj.sku,
            unit_price=item["unit_price"],
            gst_rate=item["gst_rate"],
            gst_amount=item["gst_amount"],
            subtotal=item["taxable_subtotal"]
        )
        db_order.items.append(db_item)
        p_obj.stock_quantity -= qty

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    await manager.broadcast("inventory_updated")
    return db_order

@router.put("/{order_id}", response_model=order_schemas.Order)
async def update_order(order_id: int, update_in: order_schemas.OrderUpdate, db: Session = Depends(get_db)):
    """
    Updates order status and manages inventory restocking for Cancelled/Returned orders.
    """
    db_order = db.query(order_models.Order).options(
        joinedload(order_models.Order.items).joinedload(order_models.OrderItem.product)
    ).filter(order_models.Order.id == order_id).first()
    
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_status = db_order.status
    update_data = update_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    new_status = db_order.status
    restock_triggers = ["Cancelled", "Returned"]
    inventory_needs_sync = False

    # Logic: If moving TO a restock status from a normal one
    if new_status in restock_triggers and old_status not in restock_triggers:
        for item in db_order.items:
            item.product.stock_quantity += item.quantity
        inventory_needs_sync = True
    
    # Logic: If moving FROM a restock status back to a normal one (Re-opening)
    elif old_status in restock_triggers and new_status not in restock_triggers:
        for item in db_order.items:
            if item.product.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock to re-open order for {item.product.name}")
            item.product.stock_quantity -= item.quantity
        inventory_needs_sync = True

    db.commit()
    db.refresh(db_order)
    
    await manager.broadcast("order_updated")
    if inventory_needs_sync:
        await manager.broadcast("inventory_updated")
    
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(order_models.Order).filter(order_models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db.delete(db_order)
    db.commit()
    return None