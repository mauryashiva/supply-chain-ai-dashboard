from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import models
from ...schemas import schemas
from ...core.websocket_manager import manager # To trigger real-time updates

router = APIRouter()

@router.post("/place-order", status_code=status.HTTP_201_CREATED)
async def place_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Creates a new order, saves order items, and updates inventory stock levels.
    """
    # 1. Create the main Order record
    new_order = models.Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        phone_number=order_data.phone_number,
        shipping_address=order_data.shipping_address,
        payment_status=order_data.payment_status,
        payment_method=order_data.payment_method,
        status="Pending", # Initial status
        total_amount=0 # We will calculate this below
    )
    
    db.add(new_order)
    db.flush() # Get the order ID without committing yet

    total_price = 0

    # 2. Process each item in the order
    for item in order_data.items:
        # Fetch the product to check stock and get current price
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")

        # Reduce stock quantity
        product.stock_quantity -= item.quantity
        
        # Calculate item price (including GST if applicable)
        item_total = product.selling_price * item.quantity
        total_price += item_total

        # Create OrderItem record
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_at_order=product.selling_price
        )
        db.add(order_item)

    # 3. Finalize order amount and commit
    new_order.total_amount = total_price
    db.commit()
    
    # 4. BROADCAST REAL-TIME UPDATE
    # Since stock changed, we notify the frontend to refresh product lists
    await manager.broadcast("inventory_updated")

    return {"message": "Order placed successfully", "order_id": new_order.id}