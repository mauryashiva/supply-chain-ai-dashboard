# server/app/bulk/bulk_inventory.py

import csv
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

from ..database import get_db
from ..schemas import schemas
from ..models import models

# Import helper functions for dynamic status calculation
from ..utils.settings_helpers import get_low_stock_threshold, get_product_status
# Import the shared in-memory dictionary for error reports
from ..utils.report_store import error_reports

router = APIRouter(
    prefix="/bulk/inventory",  # Prefix for all routes in this file
    tags=["Bulk Inventory"]  # Tag for API documentation
)

# Pydantic model for the upload response body
class BulkUploadResponse(BaseModel):
    message: str
    products_added: int
    products_updated: int
    errors: List[str]  # A list of error messages
    error_report_id: Optional[str] = None  # An ID to download a file of failed rows

@router.post("/upload-csv", response_model=BulkUploadResponse)
async def upload_inventory_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Imports/updates products from a CSV file.
    The 'status' column is no longer read from the CSV or saved to the DB.
    """
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    # Read the file content
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

    # Define the headers required in the CSV file
    expected_headers = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate"
    ]
    # Check if all expected headers are present
    if not all(header in original_fieldnames for header in expected_headers):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Required headers are: {', '.join(expected_headers)}"
        )

    products_to_add = []
    products_to_update = []
    update_data_map = {}
    failed_rows = []
    processed_skus = set()  # To track duplicate SKUs within the file
    added_skus = []
    updated_skus = []

    file_reader.seek(0)  # Reset reader to the beginning
    csv_reader = csv.DictReader(file_reader) 

    # Process each row in the CSV
    for row in csv_reader:
        sku = row.get("sku", "").strip()
        error_reason = None

        if not sku:
            error_reason = "Missing SKU."
        elif sku in processed_skus:
            error_reason = "Duplicate SKU found within the CSV file."
        else:
            processed_skus.add(sku)

        if error_reason:
            row_copy = dict(row)
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)
            continue

        try:
            # Get stock quantity
            stock = int(row.get("stock_quantity", 0))
            
            # Prepare data for schema validation (without 'status')
            product_data_for_schema = {
                "name": row["name"], "sku": sku, "stock_quantity": stock,
                "category": row.get("category") or None, 
                "supplier": row.get("supplier") or None,
                "reorder_level": int(row.get("reorder_level", 10)),
                "cost_price": float(row.get("cost_price", 0.0)),
                "selling_price": float(row.get("selling_price", 0.0)),
                "gst_rate": float(row.get("gst_rate", 0.0)),
                "description": row.get("description") or None,
                "last_restocked": row.get("last_restocked") or None,
            }
            # Remove any keys that have a value of None
            product_data_for_schema = {k: v for k, v in product_data_for_schema.items() if v is not None}

            # Check if product exists in the DB
            db_product = db.query(models.Product).filter(models.Product.sku == sku).first()

            if db_product:
                # Product exists, validate data for an UPDATE
                validated_data = schemas.ProductBase(**product_data_for_schema)
                products_to_update.append(db_product)
                update_data_map[sku] = {"data": validated_data}
                updated_skus.append(sku)
            else:
                # Product is new, validate data for a CREATE
                product_data_for_schema["images"] = [] # New products start with no images
                validated_data = schemas.ProductCreate(**product_data_for_schema)
                
                # Prepare data for the DB model (without 'status')
                model_data = validated_data.model_dump()
                
                products_to_add.append(models.Product(**model_data))
                added_skus.append(sku)

        except ValueError as e:
            error_reason = f"Invalid number format: {e}"
        except Exception as e:
            # Catch Pydantic validation errors or other exceptions
            error_reason = f"Data validation error: {e}" 

        if error_reason:
            row_copy = dict(row)
            row_copy["error_reason"] = error_reason
            failed_rows.append(row_copy)

    # --- Database Transaction ---
    error_strings = [f"Row {i+2} (SKU: {row.get('sku', 'N/A')}): {row['error_reason']}" for i, row in enumerate(failed_rows)]

    if not products_to_add and not products_to_update and not failed_rows:
        raise HTTPException(status_code=400, detail="No valid data found to add or update.")

    added_count = 0
    updated_count = 0
    error_report_id = None

    try:
        # Perform updates
        if products_to_update:
            for product in products_to_update:
                update_info = update_data_map[product.sku]
                update_data = update_info["data"] 
                
                # Manually update fields from the validated data
                product.name = update_data.name
                product.stock_quantity = update_data.stock_quantity
                # 'status' is not set here
                product.category = update_data.category
                product.supplier = update_data.supplier
                product.reorder_level = update_data.reorder_level
                product.cost_price = update_data.cost_price
                product.selling_price = update_data.selling_price
                product.gst_rate = update_data.gst_rate
                
                if hasattr(update_data, 'description') and update_data.description:
                    product.description = update_data.description
                if hasattr(update_data, 'last_restocked') and update_data.last_restocked:
                    product.last_restocked = update_data.last_restocked
                    
            updated_count = len(products_to_update)

        # Perform bulk inserts
        if products_to_add:
            db.bulk_save_objects(products_to_add)
            added_count = len(products_to_add)

        db.commit()

    except Exception as e:
        # If commit fails, roll back
        db.rollback()
        db_error_message = f"Database error during commit: {e}"
        error_strings.append(db_error_message)
        
        # If there were failed rows, store them for download
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

    # If commit succeeded but there were failed rows
    if failed_rows:
        error_report_id = str(uuid.uuid4())
        error_reports[error_report_id] = {"headers": original_fieldnames, "rows": failed_rows} 

    # Build the final success message
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

@router.get("/export-csv")
async def export_inventory_csv(db: Session = Depends(get_db)):
    """
    Exports all inventory products to a CSV file.
    Status is calculated dynamically during the export.
    """
    output = io.StringIO()
    # Add 'status' to the headers for the export file
    headers = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate", "status"
    ]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    
    # Get the dynamic low stock threshold
    low_stock_threshold = get_low_stock_threshold(db)
    
    products = db.query(models.Product).all()
    for product in products:
        
        # Calculate the status for each product
        calculated_status = get_product_status(product.stock_quantity, low_stock_threshold)
        
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
            # Use the calculated status's value (e.g., "In Stock")
            "status": calculated_status.value if calculated_status else None
        })
    output.seek(0)
    # Return a StreamingResponse to send the file to the user
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_export.csv",
                 "Cache-Control": "no-cache, no-store, must-revalidate",
                 "Pragma": "no-cache",
                 "Expires": "0"}
    )

@router.get("/template")
async def download_inventory_template():
    """
    Provides a CSV template file for inventory import.
    (Does not include the 'status' column).
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

@router.get("/download-errors/{report_id}")
async def download_inventory_errors(report_id: str):
    """
    Downloads a CSV file of rows that failed during a previous import.
    """
    # Retrieve the report from the in-memory store
    report_data = error_reports.get(report_id)
    
    if not report_data:
        raise HTTPException(status_code=404, detail="Error report not found or expired.")

    failed_rows = report_data.get("rows", [])
    
    # Define headers for the error file, including the error reason
    headers_with_error = [
        "name", "sku", "stock_quantity", "category", "supplier",
        "reorder_level", "cost_price", "selling_price", "gst_rate", "error_reason"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers_with_error, extrasaction='ignore')
    writer.writeheader()

    # Write each failed row along with its error
    for row_dict in failed_rows:
        row_to_write = {header: row_dict.get(header, "") for header in headers_with_error if header != "error_reason"}
        row_to_write["error_reason"] = row_dict.get("error_reason", "Unknown error")
        writer.writerow(row_to_write)

    output.seek(0)

    # Clean up the report from memory after it's prepared (optional, but good practice)
    # if report_id in error_reports:
    #     del error_reports[report_id]

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=inventory_errors_{report_id}.csv"}
    )