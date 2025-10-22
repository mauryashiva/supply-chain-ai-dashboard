import csv
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Optional, Any # Added Any
from pydantic import BaseModel

from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

# --- Temporary In-Memory Storage for Error Reports ---
error_reports: Dict[str, Dict[str, Any]] = {} # Changed type hint

# --- Helper Functions (Inventory) ---
def get_low_stock_threshold(db: Session) -> int:
    # ... (No change) ...
    setting = db.query(models.AppSettings).filter(
        models.AppSettings.setting_key == "LOW_STOCK_THRESHOLD"
    ).first()
    if setting and setting.setting_value.isdigit():
        return int(setting.setting_value)
    return 10

def get_product_status(stock_quantity: int, low_stock_threshold: int) -> schemas.StockStatus:
    # ... (No change) ...
    if stock_quantity <= 0: return schemas.StockStatus.Out_of_Stock
    elif stock_quantity <= low_stock_threshold: return schemas.StockStatus.Low_Stock
    else: return schemas.StockStatus.In_Stock

# --- Helper Function (Order) ---
def _update_product_status_local(product: models.Product, db: Session):
    # ... (No change) ...
    threshold = get_low_stock_threshold(db)
    if product.stock_quantity <= 0: product.status = models.StockStatus.Out_of_Stock
    elif product.stock_quantity <= threshold: product.status = models.StockStatus.Low_Stock
    else: product.status = models.StockStatus.In_Stock

# --- Response Models ---
class BulkUploadResponse(BaseModel):
    message: str
    products_added: int
    products_updated: int
    errors: List[str]
    error_report_id: Optional[str] = None

class OrderUploadResponse(BaseModel):
    message: str
    orders_created: int
    errors: List[str]
    # --- CHANGE 1: Add error_report_id field ---
    error_report_id: Optional[str] = None

# --- Inventory CSV Upload Endpoint (Code from previous version) ---
@router.post("/inventory/upload-csv", response_model=BulkUploadResponse)
async def upload_inventory_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Imports/updates products, provides error report ID.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    low_stock_threshold = get_low_stock_threshold(db)
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The file is empty.")

    try:
        file_text = contents.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Failed to decode file. Please ensure it is UTF-8 encoded.")

    file_reader = io.StringIO(file_text)
    csv_reader = csv.DictReader(file_reader)
    original_fieldnames = csv_reader.fieldnames or []

    expected_headers = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate"
    ]
    if not all(header in original_fieldnames for header in expected_headers):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Required headers are: {', '.join(expected_headers)}"
        )

    products_to_add = []
    products_to_update = []
    update_data_map = {}
    failed_rows = []
    line_number = 1 # Header is line 1
    processed_skus = set()
    added_skus = []
    updated_skus = []

    file_reader.seek(0)
    csv_reader = csv.DictReader(file_reader) # Recreate reader

    for row in csv_reader:
        line_number += 1
        sku = row.get("sku", "").strip()
        error_reason = None # Track error for this row

        if not sku:
            error_reason = "Missing SKU."
        elif sku in processed_skus:
            error_reason = "Duplicate SKU found within the CSV file."
        else:
            processed_skus.add(sku)

        if error_reason:
            row_copy = dict(row) # Make a copy
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)
            continue # Skip further processing for this row

        try:
            stock = int(row.get("stock_quantity", 0))
            product_data_dict = {
                "name": row["name"], "sku": sku, "stock_quantity": stock,
                "status": get_product_status(stock, low_stock_threshold),
                "category": row.get("category") or None, "supplier": row.get("supplier") or None,
                "reorder_level": int(row.get("reorder_level", 10)),
                "cost_price": float(row.get("cost_price", 0.0)),
                "selling_price": float(row.get("selling_price", 0.0)),
                "gst_rate": float(row.get("gst_rate", 0.0)), "images": []
            }
            validated_data = schemas.ProductCreate(**product_data_dict)

            db_product = db.query(models.Product).filter(models.Product.sku == sku).first()

            if db_product:
                products_to_update.append(db_product)
                update_data_map[sku] = validated_data
                updated_skus.append(sku)
            else:
                products_to_add.append(models.Product(**validated_data.model_dump()))
                added_skus.append(sku)

        except ValueError as e:
            error_reason = f"Invalid number format: {e}"
        except Exception as e:
            error_reason = f"Data validation error: {e}"

        if error_reason:
            row_copy = dict(row)
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)

    error_strings = [f"Line {i+2} (SKU: {row.get('sku', 'N/A')}): {row['error_reason']}" for i, row in enumerate(failed_rows)]

    if not products_to_add and not products_to_update and not failed_rows:
        raise HTTPException(status_code=400, detail="No valid data found to add or update.")

    added_count = 0
    updated_count = 0
    error_report_id = None

    try:
        if products_to_update:
            for product in products_to_update:
                update_data = update_data_map[product.sku]
                product.name = update_data.name
                product.stock_quantity = update_data.stock_quantity
                product.status = update_data.status
                product.category = update_data.category
                product.supplier = update_data.supplier
                product.reorder_level = update_data.reorder_level
                product.cost_price = update_data.cost_price
                product.selling_price = update_data.selling_price
                product.gst_rate = update_data.gst_rate
            updated_count = len(products_to_update)

        if products_to_add:
            db.bulk_save_objects(products_to_add)
            added_count = len(products_to_add)

        db.commit()

    except Exception as e:
        db.rollback()
        db_error_message = f"Database error during commit: {e}"
        error_strings.append(db_error_message)
        
        if failed_rows:
            error_report_id = str(uuid.uuid4())
            error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows}

        return BulkUploadResponse(
            message="CSV processing failed during database operation.",
            products_added=0,
            products_updated=0,
            errors=error_strings,
            error_report_id=error_report_id
        )

    if failed_rows:
        error_report_id = str(uuid.uuid4())
        error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows} 

    message_parts = []
    if added_count > 0: message_parts.append(f"{added_count} product(s) added.")
    if updated_count > 0: message_parts.append(f"{updated_count} product(s) updated.")
    
    if not message_parts and not failed_rows:
        final_message = "File processed. No changes made (data might be identical)."
    elif not message_parts and failed_rows:
        final_message = f"File processed with {len(failed_rows)} errors. No products were added or updated."
    else:
        final_message = " ".join(message_parts)
    
    if failed_rows:
        final_message += f" {len(failed_rows)} row(s) had errors."

    return BulkUploadResponse(
        message=final_message,
        products_added=added_count,
        products_updated=updated_count,
        errors=error_strings,
        error_report_id=error_report_id
    )

# --- Orders CSV Upload (DOWNLOAD ERRORS LOGIC ADDED) ---
@router.post("/orders/upload-csv", response_model=OrderUploadResponse)
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
    # --- CHANGE 2: Store original fieldnames ---
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

    orders_data: Dict[str, Dict[str, Any]] = {} # Parsed valid data grouped by group_id
    # --- CHANGE 3: Store failed rows and initial rows ---
    failed_rows: List[Dict[str, Any]] = [] # Rows with errors
    initial_rows_by_group: Dict[str, List[Dict]] = {} # Store original rows grouped by ID
    line_number = 1

    # --- CHANGE 4: First pass - Read, validate basic format, group ---
    file_reader_initial.seek(0) # Reset reader
    csv_reader_initial = csv.DictReader(file_reader_initial) # Recreate

    for row in csv_reader_initial:
        line_number += 1
        group_id = row.get("order_group_id", "").strip()
        row_copy = dict(row) # Store original row data
        row_copy["line_number"] = line_number # Manually add line number to original row data for tracking

        # Store all rows belonging to a group_id
        if group_id:
            if group_id not in initial_rows_by_group:
                initial_rows_by_group[group_id] = []
            initial_rows_by_group[group_id].append(row_copy)

        error_reason = None
        try:
            if not group_id:
                error_reason = "Missing 'order_group_id'."
            else:
                # Basic data type checks
                item_quantity = int(row["item_quantity"])
                discount_value = float(row.get("discount_value", 0.0))
                shipping_charges = float(row.get("shipping_charges", 0.0))

                # Check enums early if possible
                payment_method = schemas.PaymentMethod(row["payment_method"])
                raw_discount_type = row.get("discount_type")
                parsed_discount_type = None
                if raw_discount_type:
                    try:
                        parsed_discount_type = schemas.DiscountType(raw_discount_type.lower())
                    except ValueError:
                        raise ValueError(f"Invalid DiscountType '{raw_discount_type}'. Use 'percentage' or 'fixed'.")

                # If it's the first row for this group_id, create the order structure
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
                        "line_numbers": [] # Track lines for error reporting
                    }
                # Add item details if group exists and no prior error for this row
                if group_id in orders_data and not error_reason:
                    orders_data[group_id]["items"].append({
                        "sku": row["item_sku"],
                        "quantity": item_quantity,
                        "line_number": line_number # Store line number with item
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
            # If a row fails basic parsing, mark the entire group as failed if it exists
            if group_id in orders_data:
                orders_data[group_id]["has_error"] = True # Mark group as failed

    # Filter out groups that had initial errors
    valid_orders_data = {k: v for k, v in orders_data.items() if not v.get("has_error")}

    if not valid_orders_data and not failed_rows:
        raise HTTPException(status_code=400, detail="No valid order data found.")

    orders_created_count = 0
    db_errors: List[Dict[str, Any]] = [] # Store errors from DB operations

    # --- CHANGE 5: Process valid groups in a transaction ---
    try:
        with db.begin_nested(): 
            for group_id, order_info in valid_orders_data.items():
                subtotal = 0.0
                total_gst = 0.0
                db_items_to_add = []
                products_to_update = []
                item_details_for_discount = []
                current_order_failed = False # Flag for this specific order

                try:
                    # Validate products, stock, calculate totals
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

                    # Calculate discount & totals
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

                    # Create Order
                    db_order_data = order_info.copy()
                    del db_order_data["items"]
                    del db_order_data["line_numbers"] # Remove helper field
                    
                    db_order = models.Order(
                        **db_order_data, # Use filtered data
                        subtotal=round(subtotal, 2),
                        total_gst=round(total_gst, 2),
                        total_amount=round(grand_total, 2),
                        payment_status=schemas.PaymentStatus.Unpaid,
                        status=schemas.OrderStatus.Pending
                    )

                    db.add(db_order)
                    db.flush()

                    # Create OrderItems and update stock
                    for item_to_add in db_items_to_add:
                        product, quantity = item_to_add["product"], item_to_add["quantity"]
                        order_item = models.OrderItem(order_id=db_order.id, product_id=product.id, quantity=quantity)
                        db.add(order_item)
                        product.stock_quantity -= quantity
                        _update_product_status_local(product, db)

                    orders_created_count += 1

                except Exception as e:
                    # --- CHANGE 6: If DB operation fails for an order, add all its original rows to failed_rows ---
                    current_order_failed = True
                    error_reason = f"Order creation failed: {e}"
                    db_errors.append({"group_id": group_id, "error": error_reason})
                    
                    if group_id in initial_rows_by_group:
                        for original_row in initial_rows_by_group[group_id]:
                            # Avoid adding duplicate errors if row already failed in first pass
                            if not any(fr.get("line_number") == original_row.get("line_number") for fr in failed_rows):
                                row_copy = dict(original_row)
                                row_copy["error_reason"] = error_reason
                                failed_rows.append(row_copy)
                    
                    db.rollback() # Rollback the savepoint for this specific order
                    continue # Move to the next order group

            db.commit() # Commit successful orders

    except Exception as e:
        db.rollback() # Rollback the entire transaction
        # --- CHANGE 7: Add commit error and mark all rows as failed ---
        commit_error_message = f"Database transaction failed: {e}. No orders were created in this batch."
        db_errors.append({"group_id": "N/A", "error": commit_error_message})
        
        # Mark all originally *valid* groups as failed
        for group_id in valid_orders_data: # Only add errors for rows that weren't already in failed_rows
            if group_id in initial_rows_by_group:
                 for original_row in initial_rows_by_group[group_id]:
                    if not any(fr.get("line_number") == original_row.get("line_number") for fr in failed_rows):
                        row_copy = dict(original_row)
                        row_copy["error_reason"] = commit_error_message
                        failed_rows.append(row_copy)
                        
        orders_created_count = 0 # Ensure count is 0

    # --- CHANGE 8: Generate error report ID and final response ---
    error_report_id = None
    # Generate error strings from failed_rows for the simple 'errors' list
    error_strings = [f"Line {row.get('line_number', 'N/A')} (Group ID: {row.get('order_group_id', 'N/A')}): {row['error_reason']}" for row in failed_rows]

    if failed_rows:
        error_report_id = str(uuid.uuid4())
        # Store original headers and the failed rows
        error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows}

    # Construct final message
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

# --- Inventory Export Endpoint (Code from previous version) ---
@router.get("/inventory/export-csv")
async def export_inventory_csv(db: Session = Depends(get_db)):
    """
    Exports all inventory products to a CSV file.
    """
    output = io.StringIO()
    headers = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate", "status"
    ]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    products = db.query(models.Product).all()
    for product in products:
        writer.writerow({
            "name": product.name,
            "sku": product.sku,
            "stock_quantity": product.stock_quantity,
            "category": product.category,
            "supplier": product.supplier,
            "reorder_level": product.reorder_level,
            "cost_price": product.cost_price,
            "selling_price": product.selling_price,
            "gst_rate": product.gst_rate,
            "status": product.status.value if product.status else None
        })
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_export.csv"}
    )

# --- Orders Export Endpoint (Code from previous version) ---
@router.get("/orders/export-csv")
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

# --- Template Download Endpoints (Code from previous version) ---
@router.get("/inventory/template")
async def download_inventory_template():
    """
    Provides a CSV template file for inventory import.
    """
    output = io.StringIO()
    headers = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate"
    ]
    writer = csv.writer(output)
    writer.writerow(headers) # Only write the header row
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_import_template.csv"}
    )

@router.get("/orders/template")
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

# --- Inventory Error Download Endpoint (Code from previous version) ---
@router.get("/inventory/download-errors/{report_id}")
async def download_inventory_errors(report_id: str):
    """
    Downloads failed rows from an inventory upload.
    """
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

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=inventory_errors_{report_id}.csv"}
    )

# --- CHANGE 9: NEW ENDPOINT TO DOWNLOAD ORDER ERRORS ---
@router.get("/orders/download-errors/{report_id}")
async def download_order_errors(report_id: str):
    """
    Downloads the specific rows that failed during a bulk order upload.
    """
    report_data = error_reports.get(report_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Error report not found or expired.")

    failed_rows = report_data.get("rows", [])
    original_headers = report_data.get("headers", [])
    # Add the error reason column header
    headers_with_error = original_headers + ["error_reason"]

    output = io.StringIO()
    # Use extrasaction='ignore' in case error_reason was somehow in original headers
    writer = csv.DictWriter(output, fieldnames=headers_with_error, extrasaction='ignore')
    writer.writeheader()

    for row_dict in failed_rows:
        # Prepare row for writing, ensuring all original headers are present
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