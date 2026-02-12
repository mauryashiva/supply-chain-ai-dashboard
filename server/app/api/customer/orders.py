from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import models
from ...schemas import schemas
from ..auth import get_current_user # Dependency to get logged-in user
from ...core.websocket_manager import manager
from typing import List   # <-- ADD THIS LINE
from sqlalchemy.orm import joinedload



router = APIRouter()

@router.get("/my-orders", response_model=List[schemas.Order])
async def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.order_date.desc())
        .all()
    )

@router.post("/place-order", status_code=status.HTTP_201_CREATED)
async def place_order(
    order_data: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Professionally handles order creation and inventory deduction in one transaction.
    """
    # 1. Start a transaction manually to ensure atomicity
    try:
        # Initial financial setup
        total_subtotal = 0.0
        total_gst_amount = 0.0

        # 2. Create the Order object linked to the User
        new_order = models.Order(
            user_id=current_user.id,
            customer_name=order_data.customer_name,
            customer_email=order_data.customer_email,
            phone_number=order_data.phone_number,
            shipping_address=order_data.shipping_address,
            payment_method=order_data.payment_method,
            discount_value=order_data.discount_value,
            discount_type=order_data.discount_type,
            shipping_charges=order_data.shipping_charges,
            status="Pending"
        )
        
        db.add(new_order)
        db.flush() # Get the new_order.id

        # 3. Process each item and update inventory
        for item in order_data.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
            if product.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

            # ATOMIC STOCK DEDUCTION
            product.stock_quantity -= item.quantity
            
            # Calculate financials per item
            item_price = product.selling_price or 0.0
            item_subtotal = item_price * item.quantity
            item_gst = item_subtotal * ((product.gst_rate or 0.0) / 100)
            
            total_subtotal += item_subtotal
            total_gst_amount += item_gst

            # Create OrderItem entry
            order_item = models.OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity
            )
            db.add(order_item)

        # 4. Final calculation for the main Order record
        new_order.subtotal = total_subtotal
        new_order.total_gst = total_gst_amount
        
        # Calculate final total amount
        final_total = (total_subtotal + total_gst_amount + order_data.shipping_charges)
        if order_data.discount_type == "percentage":
            final_total -= (total_subtotal * (order_data.discount_value / 100))
        else:
            final_total -= order_data.discount_value

        new_order.total_amount = max(0, final_total)

        # 5. COMMIT EVERYTHING AT ONCE
        db.commit()
        
        # 6. BROADCAST TO ADMIN & CUSTOMER
        # This triggers the real-time refresh in inventory and order lists
        await manager.broadcast("inventory_updated")
        await manager.broadcast("order_updated")

        
        return {"message": "Order placed successfully", "order_id": new_order.id}

    except Exception as e:
        db.rollback() # If anything fails, revert all changes (including stock)
        raise HTTPException(status_code=500, detail=str(e))