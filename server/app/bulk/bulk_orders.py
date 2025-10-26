# server/app/bulk/bulk_orders.py

import csv
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

from ..database import get_db
from ..schemas import schemas
from ..models import models

# --- NAYE IMPORTS ---
# Helper function ko 'utils' se import kar rahe hain
from ..utils.settings_helpers import update_product_status_dynamically
# Shared error reports ko 'utils' se import kar rahe hain
from ..utils.report_store import error_reports

# Router ko prefix aur tags ke saath set karna clean rehta hai
router = APIRouter(
    prefix="/bulk/orders",
    tags=["Bulk Orders"]
)

# --- Response Model (Sirf Order ka) ---
class OrderUploadResponse(BaseModel):
    message: str
    orders_created: int
    errors: List[str]
    error_report_id: Optional[str] = None

# --- HELPER FUNCTIONS YAHAN SE HATA DIYE GAYE HAIN ---


# --- Orders CSV Upload ---
@router.post("/upload-csv", response_model=OrderUploadResponse)
async def upload_orders_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Bulk imports orders. If errors occur, stores failed rows
    and returns an ID to download them.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The file is empty.")

    try:
        file_text = contents.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Failed to decode file (must be UTF-8).")

    file_reader_initial = io.StringIO(file_text)
    csv_reader_initial = csv.DictReader(file_reader_initial)
    original_fieldnames = csv_reader_initial.fieldnames or []

    expected_headers = [
        "order_group_id", "customer_name", "customer_email", "shipping_address",
        "payment_method", "item_sku", "item_quantity",
        "discount_type", "discount_value", "shipping_charges"
    ]
    if not all(header in original_fieldnames for header in expected_headers):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Required: {', '.join(expected_headers)}"
        )

    orders_data: Dict[str, Dict[str, Any]] = {}
    failed_rows: List[Dict[str, Any]] = []
    initial_rows_by_group: Dict[str, List[Dict]] = {}
    line_number = 1

    file_reader_initial.seek(0)
    csv_reader_initial = csv.DictReader(file_reader_initial)

    for row in csv_reader_initial:
        line_number += 1
        group_id = row.get("order_group_id", "").strip()
        row_copy = dict(row)
        row_copy["line_number"] = line_number

        if group_id:
            if group_id not in initial_rows_by_group:
                initial_rows_by_group[group_id] = []
            initial_rows_by_group[group_id].append(row_copy)

        error_reason = None
        try:
            if not group_id:
                error_reason = "Missing 'order_group_id'."
            else:
                item_quantity = int(row["item_quantity"])
                discount_value = float(row.get("discount_value", 0.0))
                shipping_charges = float(row.get("shipping_charges", 0.0))
                payment_method = schemas.PaymentMethod(row["payment_method"])
                raw_discount_type = row.get("discount_type")
                parsed_discount_type = None
                if raw_discount_type:
                    try:
                        parsed_discount_type = schemas.DiscountType(raw_discount_type.lower())
                    except ValueError:
                        raise ValueError(f"Invalid DiscountType '{raw_discount_type}'. Use 'percentage' or 'fixed'.")

                if group_id not in orders_data and not error_reason:
                    orders_data[group_id] = {
                        "customer_name": row["customer_name"],
                        "customer_email": row["customer_email"],
                        "shipping_address": row["shipping_address"],
                        "payment_method": payment_method,
                        "discount_type": parsed_discount_type,
                        "discount_value": discount_value,
                        "shipping_charges": shipping_charges,
                        "items": [],
                        "line_numbers": []
                    }
                if group_id in orders_data and not error_reason:
                    orders_data[group_id]["items"].append({
                        "sku": row["item_sku"],
                        "quantity": item_quantity,
                        "line_number": line_number
                    })
                    orders_data[group_id]["line_numbers"].append(line_number)

        except ValueError as e:
            error_reason = f"Invalid data format: {e}"
        except KeyError as e:
            error_reason = f"Missing required column: {e}"
        except Exception as e:
            error_reason = f"Error processing row structure: {e}"

        if error_reason:
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)
            if group_id in orders_data:
                orders_data[group_id]["has_error"] = True

    valid_orders_data = {k: v for k, v in orders_data.items() if not v.get("has_error")}

    if not valid_orders_data and not failed_rows:
        raise HTTPException(status_code=400, detail="No valid order data found.")

    orders_created_count = 0
    db_errors: List[Dict[str, Any]] = []

    try:
        with db.begin_nested(): 
            for group_id, order_info in valid_orders_data.items():
                subtotal = 0.0
                total_gst = 0.0
                db_items_to_add = []
                products_to_update = []
                item_details_for_discount = []
                current_order_failed = False

                try:
                    for item in order_info["items"]:
                        product = db.query(models.Product).filter(models.Product.sku == item["sku"]).with_for_update().first()
                        if not product: raise Exception(f"Item SKU '{item['sku']}' (Line {item['line_number']}) not found.")
                        if product.stock_quantity < item["quantity"]: raise Exception(f"Not enough stock for {product.name} (SKU: {item['sku']}, Line {item['line_number']}). Avail:{product.stock_quantity}, Req:{item['quantity']}")
                        if product.selling_price is None: raise Exception(f"Selling price not set for {product.name} (SKU: {item['sku']}, Line {item['line_number']}).")
                        if product.gst_rate is None: raise Exception(f"GST Rate not set for {product.name} (SKU: {item['sku']}, Line {item['line_number']}).")

                        item_subtotal = product.selling_price * item["quantity"]
                        subtotal += item_subtotal
                        db_items_to_add.append({"product": product, "quantity": item["quantity"]})
                        item_details_for_discount.append({"price": item_subtotal, "gst_rate": product.gst_rate})
                        products_to_update.append(product)

                    total_discount_amount = 0.0
                    discount_value = order_info["discount_value"]
                    discount_type = order_info["discount_type"]
                    if discount_type and discount_value > 0:
                        if discount_type == schemas.DiscountType.percentage: total_discount_amount = subtotal * (discount_value / 100)
                        elif discount_type == schemas.DiscountType.fixed:
                            total_discount_amount = discount_value
                            if total_discount_amount > subtotal: raise Exception("Fixed discount > subtotal.")
                    
                    for i, item_detail in enumerate(item_details_for_discount):
                        item_price, item_gst_rate = item_detail["price"], item_detail["gst_rate"]
                        item_discount = (item_price / subtotal * total_discount_amount) if subtotal > 0 else 0
                        taxable_value = item_price - item_discount
                        total_gst += taxable_value * (item_gst_rate / 100)
                    
                    grand_total = (subtotal - total_discount_amount) + total_gst + order_info["shipping_charges"]

                    db_order_data = order_info.copy()
                    del db_order_data["items"]
                    del db_order_data["line_numbers"]
                    
                    db_order = models.Order(
                        **db_order_data,
                        subtotal=round(subtotal, 2),
                        total_gst=round(total_gst, 2),
                        total_amount=round(grand_total, 2),
                        payment_status=schemas.PaymentStatus.Unpaid,
                        status=schemas.OrderStatus.Pending
                    )
                    db.add(db_order)
                    db.flush()

                    for item_to_add in db_items_to_add:
                        product, quantity = item_to_add["product"], item_to_add["quantity"]
                        order_item = models.OrderItem(order_id=db_order.id, product_id=product.id, quantity=quantity)
                        db.add(order_item)
                        product.stock_quantity -= quantity
                        
                        # --- IMPORTANT: IMPORTED FUNCTION KA ISTEMAL ---
                        # '_update_product_status_local' ki jagah
                        # update_product_status_dynamically(product, db)

                    orders_created_count += 1

                except Exception as e:
                    current_order_failed = True
                    error_reason = f"Order creation failed: {e}"
                    db_errors.append({"group_id": group_id, "error": error_reason})
                    
                    if group_id in initial_rows_by_group:
                        for original_row in initial_rows_by_group[group_id]:
                            if not any(fr.get("line_number") == original_row.get("line_number") for fr in failed_rows):
                                row_copy = dict(original_row)
                                row_copy["error_reason"] = error_reason
                                failed_rows.append(row_copy)
                    
                    db.rollback() 
                    continue 

            db.commit()

    except Exception as e:
        db.rollback()
        commit_error_message = f"Database transaction failed: {e}. No orders were created in this batch."
        db_errors.append({"group_id": "N/A", "error": commit_error_message})
        
        for group_id in valid_orders_data:
            if group_id in initial_rows_by_group:
                for original_row in initial_rows_by_group[group_id]:
                    if not any(fr.get("line_number") == original_row.get("line_number") for fr in failed_rows):
                        row_copy = dict(original_row)
                        row_copy["error_reason"] = commit_error_message
                        failed_rows.append(row_copy)
                        
        orders_created_count = 0

    error_report_id = None
    error_strings = [f"Line {row.get('line_number', 'N/A')} (Group ID: {row.get('order_group_id', 'N/A')}): {row['error_reason']}" for row in failed_rows]

    if failed_rows:
        error_report_id = str(uuid.uuid4())
        # --- SHARED DICTIONARY KA ISTEMAL ---
        error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows}

    if orders_created_count > 0:
        final_message = f"{orders_created_count} order(s) created successfully."
        if failed_rows:
            final_message += f" {len(failed_rows)} row(s) corresponding to failed orders had errors."
    elif failed_rows:
        final_message = f"File processed, but {len(failed_rows)} row(s) had errors. No orders were created."
    else:
        final_message = "File processed. No valid orders found or created."


    return OrderUploadResponse(
        message=final_message,
        orders_created=orders_created_count,
        errors=error_strings,
        error_report_id=error_report_id
    )

# --- Orders Export Endpoint ---
@router.get("/export-csv")
async def export_orders_csv(db: Session = Depends(get_db)):
    """
    Exports all orders and their items to a CSV file.
    """
    output = io.StringIO()
    headers = [
        "order_group_id", "customer_name", "customer_email", "shipping_address",
        "payment_method", "item_sku", "item_quantity",
        "discount_type", "discount_value", "shipping_charges",
        "subtotal", "total_gst", "total_amount", "status", "payment_status"
    ]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    orders = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).all()
    
    for order in orders:
        if not order.items:
            writer.writerow({
                "order_group_id": order.id,
                "customer_name": order.customer_name,
                "customer_email": order.customer_email,
                "shipping_address": order.shipping_address,
                "payment_method": order.payment_method.value if order.payment_method else None,
                "item_sku": None,
                "item_quantity": None,
                "discount_type": order.discount_type.value if order.discount_type else None,
                "discount_value": order.discount_value,
                "shipping_charges": order.shipping_charges,
                "subtotal": order.subtotal,
                "total_gst": order.total_gst,
                "total_amount": order.total_amount,
                "status": order.status.value if order.status else None,
                "payment_status": order.payment_status.value if order.payment_status else None,
            })
        else:
            for item in order.items:
                writer.writerow({
                    "order_group_id": order.id,
                    "customer_name": order.customer_name,
                    "customer_email": order.customer_email,
                    "shipping_address": order.shipping_address,
                    "payment_method": order.payment_method.value if order.payment_method else None,
                    "item_sku": item.product.sku if item.product else None,
                    "item_quantity": item.quantity,
                    "discount_type": order.discount_type.value if order.discount_type else None,
                    "discount_value": order.discount_value,
                    "shipping_charges": order.shipping_charges,
                    "subtotal": order.subtotal,
                    "total_gst": order.total_gst,
                    "total_amount": order.total_amount,
                    "status": order.status.value if order.status else None,
                    "payment_status": order.payment_status.value if order.payment_status else None,
                })
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )

# --- Template Download Endpoint ---
@router.get("/template")
async def download_orders_template():
    """
    Provides a CSV template file for orders import.
    """
    output = io.StringIO()
    headers = [
        "order_group_id", "customer_name", "customer_email", "shipping_address",
        "payment_method", "item_sku", "item_quantity",
        "discount_type", "discount_value", "shipping_charges"
    ]
    writer = csv.writer(output)
    writer.writerow(headers) # Only write the header row
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_import_template.csv"}
    )

# --- Order Error Download Endpoint ---
@router.get("/download-errors/{report_id}")
async def download_order_errors(report_id: str):
    """
    Downloads the specific rows that failed during a bulk order upload.
    """
    # --- SHARED DICTIONARY KA ISTEMAL ---
    report_data = error_reports.get(report_id)
    
    if not report_data:
        raise HTTPException(status_code=404, detail="Error report not found or expired.")

    failed_rows = report_data.get("rows", [])
    original_headers = report_data.get("headers", [])
    headers_with_error = original_headers + ["error_reason"]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers_with_error, extrasaction='ignore')
    writer.writeheader()

    for row_dict in failed_rows:
        row_to_write = {header: row_dict.get(header, "") for header in original_headers}
        row_to_write["error_reason"] = row_dict.get("error_reason", "Unknown error")
        writer.writerow(row_to_write)

    output.seek(0)

    # Optional: Remove the report from memory after download
    # del error_reports[report_id]

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=order_errors_{report_id}.csv"}
    )