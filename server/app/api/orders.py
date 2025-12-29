from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload  # For eager-loading related models
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()


@router.get("/", response_model=List[schemas.Order])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches all orders, eager-loading item and product details.
    """
    orders = (
        db.query(models.Order)
        .options(
            # Eager load items, and within items, eager load the product
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
    """
    Creates a new order, validates stock, and calculates all financial totals
    (subtotal, discount, GST, and final total) on the server.
    """
    
    if not order.items:
        raise HTTPException(status_code=400, detail="An order must contain at least one item.")

    subtotal = 0
    total_gst = 0
    order_products_details = []  # To temporarily store product info for calculations

    # Step 1: Validate products, check stock, and calculate subtotal
    for item_data in order.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item_data.product_id} not found.")
        
        if product.selling_price is None or product.gst_rate is None:
             raise HTTPException(status_code=400, detail=f"Product '{product.name}' is missing selling price or GST rate.")

        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for {product.name}. Available: {product.stock_quantity}, Requested: {item_data.quantity}"
            )
            
        item_total_price = product.selling_price * item_data.quantity
        subtotal += item_total_price
        
        order_products_details.append({
            "product_obj": product,
            "quantity": item_data.quantity,
            "item_total_price": item_total_price
        })

    # Step 2: Calculate the total discount amount
    total_discount_amount = 0
    if order.discount_type and order.discount_value is not None and order.discount_value > 0:
        if order.discount_type == schemas.DiscountType.percentage:
            total_discount_amount = subtotal * (order.discount_value / 100)
        elif order.discount_type == schemas.DiscountType.fixed:
            total_discount_amount = order.discount_value
            if total_discount_amount > subtotal:
                raise HTTPException(status_code=400, detail="Fixed discount cannot be greater than the subtotal.")

    # Step 3: Calculate total GST based on proportional discount distribution
    for item in order_products_details:
        item_total_price = item["item_total_price"]
        product_obj = item["product_obj"]
        
        # Calculate this item's proportional share of the discount
        item_discount = 0
        if subtotal > 0 and total_discount_amount > 0:
            item_share_of_subtotal = item_total_price / subtotal
            item_discount = item_share_of_subtotal * total_discount_amount
        
        # Calculate GST on the post-discount (taxable) value
        taxable_value = item_total_price - item_discount
        item_gst = taxable_value * (product_obj.gst_rate / 100)
        total_gst += item_gst

    # Step 4: Calculate the final total amount
    total_amount = (subtotal - total_discount_amount) + total_gst + (order.shipping_charges or 0)

    # Step 5: Create the Order DB object, merging client data with calculated data
    client_data = order.model_dump(exclude_unset=True, exclude={"items"})
    
    db_order_data = {
        **client_data,  # Includes fields like status, payment_status, customer_name, etc.
        "subtotal": round(subtotal, 2),
        "total_gst": round(total_gst, 2),
        "total_amount": round(total_amount, 2),
    }
    
    db_order = models.Order(**db_order_data)

    # Step 6: Create OrderItem objects, link them to the order, and update product stock
    for item in order_products_details:
        product_obj = item["product_obj"]
        quantity = item["quantity"]
        
        order_item = models.OrderItem(quantity=quantity)
        order_item.product = product_obj
        db_order.items.append(order_item)
        
        # Deduct stock
        product_obj.stock_quantity -= quantity

    # Step 7: Commit the transaction
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    """
    Updates an order's fulfillment status (status, payment, tracking, etc.).
    Also handles restocking items if an order is Cancelled or Returned.
    """
    db_order = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.id == order_id).first()
    
    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    original_status = db_order.status  # Store the status before updates
    update_data = order_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    new_status = db_order.status
    restock_statuses = [models.OrderStatus.Cancelled, models.OrderStatus.Returned]

    # Handle stock adjustment if status changed to or from a restock-required status
    if new_status in restock_statuses and original_status not in restock_statuses:
        # Order was just cancelled/returned, add stock back
        for item in db_order.items:
            item.product.stock_quantity += item.quantity
    
    elif original_status in restock_statuses and new_status not in restock_statuses:
        # Order was previously cancelled/returned and is now being re-opened
        for item in db_order.items:
            if item.product.stock_quantity < item.quantity:
                # Check if there is enough stock to "un-cancel"
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reverse return for {item.product.name}. Not enough stock available."
                )
            item.product.stock_quantity -= item.quantity

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Deletes an order from the database.
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    db.delete(db_order)
    db.commit()
    return None