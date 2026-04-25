import hashlib
import hmac
from datetime import datetime, timezone
from typing import List, Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Modular Imports
from ...config import settings
from ...database import get_db
from ...models import shared as shared_models
from ...models.admin import inventory as inventory_models
from ...models.admin import order as order_models
from ..auth import get_current_user

router = APIRouter()

# --- INTERNAL SCHEMAS ---

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class RazorpayOrderCreateRequest(BaseModel):
    items: List[CheckoutItem]
    discount_value: Optional[float] = 0.0
    discount_type: Optional[str] = None
    shipping_charges: Optional[float] = 0.0
    receipt: Optional[str] = None

class RazorpayPaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# --- HELPERS ---

def _calculate_total_amount(payload: RazorpayOrderCreateRequest, db: Session) -> float:
    """
    Logic to calculate the final payable amount by validating stock 
    and extracting GST from inclusive pricing.
    """
    total_subtotal = 0.0
    total_amount_inclusive = 0.0

    if not payload.items:
        raise HTTPException(status_code=400, detail="No checkout items provided")

    for item in payload.items:
        # Use modular admin inventory model
        product = db.query(inventory_models.Product).filter(
            inventory_models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}",
            )

        price_inc_gst = product.selling_price or 0.0
        gst_rate = product.gst_rate or 0.0

        # Extract Taxable Base (Exclusive of GST)
        taxable_price = price_inc_gst / (1 + gst_rate / 100) if gst_rate else price_inc_gst
        
        total_subtotal += (taxable_price * item.quantity)
        total_amount_inclusive += (price_inc_gst * item.quantity)

    final_total = total_amount_inclusive + (payload.shipping_charges or 0.0)

    # Use modular admin order enums for logic
    if payload.discount_type == order_models.DiscountType.percentage.value:
        final_total -= total_subtotal * ((payload.discount_value or 0) / 100)
    elif payload.discount_type == order_models.DiscountType.fixed.value:
        final_total -= payload.discount_value or 0

    return max(0, final_total)


# --- ENDPOINTS ---

@router.post("/razorpay/create-order", status_code=status.HTTP_201_CREATED)
async def create_razorpay_order(
    payload: RazorpayOrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: shared_models.User = Depends(get_current_user),
):
    """
    Initiates a Razorpay order with the calculated amount in paise.
    """
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Razorpay is not configured on the server",
        )

    final_total = _calculate_total_amount(payload, db)
    # Razorpay expects amount in the smallest currency unit (paise for INR)
    amount_in_paise = int(round(final_total * 100))

    if amount_in_paise <= 0:
        raise HTTPException(status_code=400, detail="Invalid payable amount")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    receipt_id = payload.receipt or (
        f"rcpt_{current_user.id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    )

    try:
        razorpay_order = client.order.create(
            {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "payment_capture": 1,
            }
        )
    except Exception as exc:
        print(f"Razorpay Error: {exc}")
        raise HTTPException(status_code=502, detail="Failed to create payment order with gateway")

    return {
        "order_id": razorpay_order.get("id"),
        "amount": razorpay_order.get("amount"),
        "currency": razorpay_order.get("currency", "INR"),
        "key_id": settings.RAZORPAY_KEY_ID,
    }


@router.post("/razorpay/verify", status_code=status.HTTP_200_OK)
async def verify_razorpay_payment(
    payload: RazorpayPaymentVerifyRequest,
    current_user: shared_models.User = Depends(get_current_user),
):
    """
    Verifies the HMAC signature provided by Razorpay to ensure payment integrity.
    """
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Gateway secret not configured",
        )

    # Signature verification logic
    signature_payload = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        signature_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    return {
        "verified": True,
        "payment_id": payload.razorpay_payment_id,
        "order_id": payload.razorpay_order_id,
        "user_id": current_user.id,
    }