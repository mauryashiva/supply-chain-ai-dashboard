import csv
import io
import uuid # --- CHANGE 1: Import uuid ---
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Optional
from pydantic import BaseModel # --- Typo 'pantic' ko 'pydantic' se fix kiya gaya ---

from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

# --- Temporary In-Memory Storage for Error Reports ---
# WARNING: This data will be lost on server restart. Use Redis or DB for persistence.
error_reports: Dict[str, List[Dict]] = {}

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
    errors: List[str] # Keep this for simple error messages
    # --- CHANGE 2: Add optional field for error report ID ---
    error_report_id: Optional[str] = None

class OrderUploadResponse(BaseModel):
    message: str
    orders_created: int
    errors: List[str]
    # We can add error report functionality here later if needed

# --- Inventory CSV Upload Endpoint (DOWNLOAD ERRORS LOGIC) ---
@router.post("/inventory/upload-csv", response_model=BulkUploadResponse)
async def upload_inventory_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Bulk imports/updates products. If errors occur, stores failed rows
    and returns an ID to download them.
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
    # --- CHANGE 3: Store original fieldnames ---
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
    # --- CHANGE 4: Store failed rows with original data + error ---
    failed_rows = []
    line_number = 1 # Header is line 1
    processed_skus = set()
    added_skus = []
    updated_skus = []

    # --- CHANGE 5: Reset file reader to read rows again ---
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
            # --- CHANGE 6: Store the original row and the error ---
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
            # --- CHANGE 7: Store row and error if validation fails ---
            row_copy = dict(row)
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)

    # Convert failed row errors to simple strings for the 'errors' list in response
    error_strings = [f"Line {i+2} (SKU: {row.get('sku', 'N/A')}): {row['error_reason']}" for i, row in enumerate(failed_rows)]


    if not products_to_add and not products_to_update and not failed_rows:
        raise HTTPException(status_code=400, detail="No valid data found to add or update.")

    added_count = 0
    updated_count = 0
    error_report_id = None

    try:
        # Perform updates
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

        # Perform adds
        if products_to_add:
            db.bulk_save_objects(products_to_add)
            added_count = len(products_to_add)

        db.commit()

    except Exception as e:
        db.rollback()
        # Add DB error to the simple list
        db_error_message = f"Database error during commit: {e}"
        error_strings.append(db_error_message)
        
        # --- CHANGE 8: Generate error report ID even on DB failure if there were initial errors ---
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

    # --- CHANGE 9: Generate error report ID if processing finished with errors ---
    if failed_rows:
        error_report_id = str(uuid.uuid4())
        # Store headers too
        error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows} 

    # Construct success message
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
        errors=error_strings, # Still return simple error strings
        error_report_id=error_report_id # Return the ID if errors occurred
    )


# --- Orders CSV Upload (Full code from previous version) ---
@router.post("/orders/upload-csv", response_model=OrderUploadResponse)
async def upload_orders_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Bulk imports multiple orders from a CSV file.
    Uses professional calculation logic.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The file is empty.")
    try:
        file_text = contents.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Failed to decode file. Please ensure it is UTF-8 encoded.")
    file_reader = io.StringIO(file_text)
    csv_reader = csv.DictReader(file_reader)
    expected_headers = [
        "order_group_id", "customer_name", "customer_email", "shipping_address",
        "payment_method", "item_sku", "item_quantity",
        "discount_type", "discount_value", "shipping_charges"
    ]
    if not all(header in (csv_reader.fieldnames or []) for header in expected_headers):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Required headers are: {', '.join(expected_headers)}"
        )
    orders_data = {}
    errors = []
    line_number = 1
    for row in csv_reader:
        line_number += 1
        try:
            group_id = row["order_group_id"]
            if not group_id:
                errors.append(f"Line {line_number}: Missing 'order_group_id'.")
                continue
            if group_id not in orders_data:
                raw_discount_type = row.get("discount_type")
                parsed_discount_type = None
                if raw_discount_type:
                    try:
                        parsed_discount_type = schemas.DiscountType(raw_discount_type.lower())
                    except ValueError:
                        raise ValueError(f"'{raw_discount_type}' is not a valid DiscountType. Use 'percentage' or 'fixed'.")
                orders_data[group_id] = {
                    "customer_name": row["customer_name"],
                    "customer_email": row["customer_email"],
                    "shipping_address": row["shipping_address"],
                    "payment_method": schemas.PaymentMethod(row["payment_method"]),
                    "discount_type": parsed_discount_type,
                    "discount_value": float(row.get("discount_value", 0.0)),
                    "shipping_charges": float(row.get("shipping_charges", 0.0)),
                    "items": []
                }
            orders_data[group_id]["items"].append({
                "sku": row["item_sku"],
                "quantity": int(row["item_quantity"])
            })
        except ValueError as e:
            errors.append(f"Line {line_number}: Invalid data format. {e}")
        except Exception as e:
            errors.append(f"Line {line_number}: Error processing row. {e}")
    if not orders_data and not errors:
        raise HTTPException(status_code=400, detail="No valid order data found in the file.")
    orders_created_count = 0
    final_errors = list(errors) 
    try:
        with db.begin_nested(): 
            for group_id, order_info in orders_data.items():
                subtotal = 0.0
                total_gst = 0.0
                db_items_to_add = []
                products_to_update = []
                item_details_for_discount = [] 
                try:
                    for item in order_info["items"]:
                        product = db.query(models.Product).filter(models.Product.sku == item["sku"]).with_for_update().first() 
                        if not product: raise Exception(f"Product SKU '{item['sku']}' not found.")
                        if product.stock_quantity < item["quantity"]: raise Exception(f"Not enough stock for {product.name} (SKU: {item['sku']}). Available: {product.stock_quantity}, Requested: {item['quantity']}")
                        if product.selling_price is None: raise Exception(f"Selling price for {product.name} (SKU: {item['sku']}) is not set.")
                        if product.gst_rate is None: raise Exception(f"GST Rate for {product.name} (SKU: {item['sku']}) is not set.")
                        item_subtotal = product.selling_price * item["quantity"]
                        subtotal += item_subtotal
                        db_items_to_add.append({"product": product, "quantity": item["quantity"]})
                        item_details_for_discount.append({"price": item_subtotal, "gst_rate": product.gst_rate})
                        products_to_update.append(product) 
                    total_discount_amount = 0.0
                    discount_value = order_info["discount_value"]
                    discount_type = order_info["discount_type"]
                    if discount_type and discount_value > 0:
                        if discount_type == schemas.DiscountType.percentage:
                            total_discount_amount = subtotal * (discount_value / 100)
                        elif discount_type == schemas.DiscountType.fixed:
                            total_discount_amount = discount_value
                            if total_discount_amount > subtotal:
                                raise Exception("Fixed discount cannot be greater than subtotal.")
                    for i, item_detail in enumerate(item_details_for_discount):
                        item_price = item_detail["price"]
                        item_gst_rate = item_detail["gst_rate"]
                        item_discount = 0
                        if subtotal > 0 and total_discount_amount > 0:
                           item_share = item_price / subtotal
                           item_discount = item_share * total_discount_amount
                        taxable_value = item_price - item_discount
                        item_gst = taxable_value * (item_gst_rate / 100)
                        total_gst += item_gst
                    grand_total = (subtotal - total_discount_amount) + total_gst + order_info["shipping_charges"]
                    db_order = models.Order(
                        customer_name=order_info["customer_name"],
                        customer_email=order_info["customer_email"],
                        shipping_address=order_info["shipping_address"],
                        payment_method=order_info["payment_method"],
                        payment_status=schemas.PaymentStatus.Unpaid,
                        status=schemas.OrderStatus.Pending, 
                        subtotal=round(subtotal, 2),
                        discount_type=order_info["discount_type"],
                        discount_value=order_info["discount_value"],
                        total_gst=round(total_gst, 2), 
                        shipping_charges=order_info["shipping_charges"],
                        total_amount=round(grand_total, 2) 
                    )
                    db.add(db_order)
                    db.flush() 
                    for item_to_add in db_items_to_add:
                        product = item_to_add["product"]
                        quantity = item_to_add["quantity"]
                        order_item = models.OrderItem(order_id=db_order.id, product_id=product.id, quantity=quantity)
                        db.add(order_item)
                        product.stock_quantity -= quantity
                        _update_product_status_local(product, db)
                    orders_created_count += 1
                except Exception as e:
                    final_errors.append(f"Order Group ID '{group_id}': Failed. Reason: {str(e)}")
                    continue 
            db.commit() 
    except Exception as e:
        db.rollback() 
        final_errors.append(f"Database transaction failed: {str(e)}. No orders were created in this batch.")
        orders_created_count = 0 
    return OrderUploadResponse(
        message="Orders CSV processed.",
        orders_created=orders_created_count,
        errors=final_errors
    )


# --- Inventory Export Endpoint (Full code from previous version) ---
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

# --- Orders Export Endpoint (Full code from previous version) ---
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


# --- Template Download Endpoints (Full code from previous version) ---
@router.get("/inventory/template")
async def download_inventory_template():
    """
    Provides a CSV template file with only the required headers for inventory import.
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
    Provides a CSV template file with only the required headers for orders import.
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


# --- CHANGE 10: NEW ENDPOINT TO DOWNLOAD ERROR FILE ---
@router.get("/inventory/download-errors/{report_id}")
async def download_inventory_errors(report_id: str):
    """
    Downloads the specific rows that failed during a bulk inventory upload.
    """
    report_data = error_reports.get(report_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Error report not found or expired.")

    failed_rows = report_data["rows"]
    original_headers = report_data["headers"]
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
        headers={"Content-Disposition": f"attachment; filename=inventory_errors_{report_id}.csv"}
    )