from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ...database import get_db
from ...models import models
from ...schemas import schemas
from ..auth import get_current_user
from ...core.websocket_manager import manager
from datetime import datetime, timezone # Use modern timezone-aware dates

router = APIRouter()


# ================================
# GET MY ORDERS
# ================================
@router.get("/my-orders", response_model=List[schemas.Order])
async def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Order)
         .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
            joinedload(models.Order.user),
            joinedload(models.Order.address)
        )
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.order_date.desc())
        .all()
    )


# ================================
# PLACE ORDER (GST INCLUDED PRICING)
# ================================
@router.post("/place-order", status_code=status.HTTP_201_CREATED)
async def place_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:

        # ================================
        # 1. VALIDATE ADDRESS
        # ================================
        address = db.query(models.Address).filter(
            models.Address.id == order_data.address_id,
            models.Address.user_id == current_user.id
        ).first()

        if not address:
            raise HTTPException(status_code=404, detail="Address not found")

        total_subtotal = 0.0
        total_gst_amount = 0.0
        total_amount = 0.0

        # ================================
        # 2. CREATE ORDER BASE
        # ================================
        new_order = models.Order(
            user_id=current_user.id,
            address_id=address.id,
            order_date=datetime.now(timezone.utc),

            customer_name=address.full_name,
            customer_email=current_user.email,
            phone_number=address.phone_number,
            shipping_address=f"{address.flat}, {address.area}, {address.city}, {address.state} - {address.pincode}",

            payment_method=order_data.payment_method,
            payment_status=models.PaymentStatus.Pending,
            discount_value=order_data.discount_value or 0.0,
            discount_type=order_data.discount_type,
            shipping_charges=order_data.shipping_charges or 0.0,
            status=models.OrderStatus.Pending
        )

        db.add(new_order)
        db.flush()

        # ================================
        # 3. PROCESS ITEMS
        # ================================
        for item in order_data.items:

            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .with_for_update()
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found"
                )

            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}"
                )

            # Deduct stock
            product.stock_quantity -= item.quantity

            price_including_gst = product.selling_price or 0.0
            gst_rate = product.gst_rate or 0.0

            # ================================
            # GST EXTRACTION (IMPORTANT)
            # ================================
            taxable_price = price_including_gst / (1 + gst_rate / 100) if gst_rate else price_including_gst
            gst_amount = price_including_gst - taxable_price

            item_subtotal = taxable_price * item.quantity
            item_gst = gst_amount * item.quantity
            item_total = price_including_gst * item.quantity

            total_subtotal += item_subtotal
            total_gst_amount += item_gst
            total_amount += item_total

            order_item = models.OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity,

                  # Identity Snapshot
                product_name=product.name,       
                product_sku=product.sku,    
                   # Financial Snapshot
                unit_price=price_including_gst,
                gst_rate=gst_rate,
                gst_amount=round(item_gst, 2),
                subtotal=round(item_subtotal, 2)
            )

            db.add(order_item)

        # ================================
        # 4. FINAL TOTAL CALCULATION
        # ================================
        new_order.subtotal = total_subtotal
        new_order.total_gst = total_gst_amount

        final_total = total_amount + (order_data.shipping_charges or 0.0)

        if order_data.discount_type == models.DiscountType.percentage:
            final_total -= total_subtotal * ((order_data.discount_value or 0) / 100)
        else:
            final_total -= (order_data.discount_value or 0)

        new_order.total_amount = max(0, final_total)

        # ================================
        # 5. COMMIT
        # ================================
        db.commit()

        # ================================
        # 6. REAL TIME SYNC
        # ================================
        await manager.broadcast("inventory_updated")
        await manager.broadcast("order_updated")

        return {
            "message": "Order placed successfully",
            "order_id": new_order.id
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))