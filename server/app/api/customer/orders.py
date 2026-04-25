from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone

# Modular Imports (Triple dot to reach app root)
from ...database import get_db
from ...models.shared import User
from ...models.customer import address as address_models
from ...models.admin import inventory as inventory_models
from ...models.admin import order as order_models
from ...schemas.admin import order as order_schemas
from ..auth import get_current_user
from ...core.websocket_manager import manager

router = APIRouter()

# ================================
# GET MY ORDERS
# ================================
@router.get("/my-orders", response_model=List[order_schemas.Order])
async def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the order history for the currently authenticated customer.
    """
    return (
        db.query(order_models.Order)
         .options(
            joinedload(order_models.Order.items).joinedload(order_models.OrderItem.product),
            joinedload(order_models.Order.user),
            joinedload(order_models.Order.address)
        )
        .filter(order_models.Order.user_id == current_user.id)
        .order_by(order_models.Order.order_date.desc())
        .all()
    )


# ================================
# PLACE ORDER (GST INCLUDED PRICING)
# ================================
@router.post("/place-order", status_code=status.HTTP_201_CREATED)
async def place_order(
    order_data: order_schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handles customer checkout: Validates stock, extracts GST from inclusive pricing, 
    snapshots product data, and updates inventory in real-time.
    """
    try:
        # 1. Validate Delivery Address
        address = db.query(address_models.Address).filter(
            address_models.Address.id == order_data.address_id,
            address_models.Address.user_id == current_user.id
        ).first()

        if not address:
            raise HTTPException(status_code=404, detail="Selected address not found")

        total_subtotal = 0.0
        total_gst_amount = 0.0
        total_amount = 0.0

        # 2. Initialize Order Base
        new_order = order_models.Order(
            user_id=current_user.id,
            address_id=address.id,
            order_date=datetime.now(timezone.utc),

            customer_name=address.full_name,
            customer_email=current_user.email,
            phone_number=address.phone_number,
            shipping_address=f"{address.flat}, {address.area}, {address.city}, {address.state} - {address.pincode}",

            payment_method=order_data.payment_method,
            payment_status=order_models.PaymentStatus.Pending,
            discount_value=order_data.discount_value or 0.0,
            discount_type=order_data.discount_type,
            shipping_charges=order_data.shipping_charges or 0.0,
            status=order_models.OrderStatus.Pending
        )

        db.add(new_order)
        db.flush() # Get order ID without committing yet

        # 3. Process Order Items & Inventory Deduction
        for item in order_data.items:
            # Use FOR UPDATE to prevent race conditions during high-traffic checkout
            product = (
                db.query(inventory_models.Product)
                .filter(inventory_models.Product.id == item.product_id)
                .with_for_update() 
                .first()
            )

            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}"
                )

            # Deduct from inventory
            product.stock_quantity -= item.quantity

            price_inc_gst = product.selling_price or 0.0
            gst_rate = product.gst_rate or 0.0

            # GST EXTRACTION Logic: Price is inclusive of GST
            # Taxable = Price / (1 + Rate/100)
            taxable_unit_price = price_inc_gst / (1 + gst_rate / 100) if gst_rate else price_inc_gst
            gst_unit_amount = price_inc_gst - taxable_unit_price

            item_taxable_total = taxable_unit_price * item.quantity
            item_gst_total = gst_unit_amount * item.quantity
            item_final_total = price_inc_gst * item.quantity

            total_subtotal += item_taxable_total
            total_gst_amount += item_gst_total
            total_amount += item_final_total

            # Create immutable snapshot of the product in OrderItem
            order_item = order_models.OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity,
                product_name=product.name,       
                product_sku=product.sku,    
                unit_price=price_inc_gst,
                gst_rate=gst_rate,
                gst_amount=round(item_gst_total, 2),
                subtotal=round(item_taxable_total, 2)
            )

            db.add(order_item)

        # 4. Final Financial Aggregation
        new_order.subtotal = round(total_subtotal, 2)
        new_order.total_gst = round(total_gst_amount, 2)

        final_total = total_amount + (order_data.shipping_charges or 0.0)

        # Apply discounts to the gross total
        if order_data.discount_type == order_models.DiscountType.percentage:
            final_total -= total_subtotal * ((order_data.discount_value or 0) / 100)
        else:
            final_total -= (order_data.discount_value or 0)

        new_order.total_amount = round(max(0, final_total), 2)

        # 5. Finalize Transaction
        db.commit()

        # 6. Real-time Dashboard Sync
        await manager.broadcast("inventory_updated")
        await manager.broadcast("order_updated")

        return {
            "message": "Order placed successfully",
            "order_id": new_order.id
        }

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Checkout Error: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred during checkout")