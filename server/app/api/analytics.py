# server/app/api/analytics.py

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, Date, cast, extract
from pydantic import BaseModel, ConfigDict
from typing import List, Dict
import io
import csv
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .auth import get_current_user
from datetime import datetime, timedelta, date
from calendar import month_abbr

# Import helper function to get dynamic settings
from ..utils.settings_helpers import get_low_stock_threshold

router = APIRouter(dependencies=[Depends(get_current_user)])

# --- SCHEMAS ---

class RevenueDataPoint(BaseModel):
    date: date
    revenue: float

class RevenueOverTimeResponse(BaseModel):
    data: List[RevenueDataPoint]

class MonthlyRevenueDataPoint(BaseModel):
    month: str
    revenue: float

class MonthlyRevenueResponse(BaseModel):
    data: List[MonthlyRevenueDataPoint]

class LowStockProduct(BaseModel):
    name: str
    stock_quantity: int
    
    # Pydantic V2 configuration to allow reading from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)

class LowStockProductResponse(BaseModel):
    data: List[LowStockProduct]

# --- ANALYTICS ENDPOINTS ---

@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Calculates and returns key analytics summary data from the database.
    """
    # 1. Get dynamic threshold
    low_stock_threshold = get_low_stock_threshold(db)

    # 2. KPI Metrics calculation
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    pending_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.status == schemas.OrderStatus.Pending
    ).scalar() or 0
    delivered_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.status == schemas.OrderStatus.Delivered
    ).scalar() or 0
    
    low_stock_items_count = db.query(func.count(models.Product.id)).filter(
        models.Product.stock_quantity <= low_stock_threshold,
        models.Product.stock_quantity > 0
    ).scalar() or 0

    total_inventory_value = db.query(
        func.sum(models.Product.stock_quantity * func.coalesce(models.Product.cost_price, 0.0))
    ).filter(models.Product.stock_quantity > 0).scalar() or 0.0

    # 3. Format KPI cards
    kpi_cards = [
        {"title": "Total Orders", "value": f"{total_orders:,}", "change": ""},
        {"title": "Revenue", "value": f"₹{total_revenue:,.2f}", "change": ""},
        {"title": "Inventory Value", "value": f"₹{total_inventory_value:,.2f}", "change": ""},
        {"title": "Pending Orders", "value": str(pending_orders), "change": ""},
        {"title": "Low Stock Items", "value": str(low_stock_items_count), "change": ""},
    ]

    # 4. Top Selling Products
    top_products_query = db.query(
        models.Product.name,
        func.sum(models.OrderItem.quantity).label("total_quantity")
    ).join(models.OrderItem, models.OrderItem.product_id == models.Product.id)\
     .group_by(models.Product.name)\
     .order_by(func.sum(models.OrderItem.quantity).desc())\
     .limit(5)\
     .all()
    
    top_selling_products = [{"name": name, "value": qty} for name, qty in top_products_query]

    # 5. Delivery Status Breakdown
    delayed_statuses = [
        schemas.OrderStatus.Pending, 
        schemas.OrderStatus.Processing,
        schemas.OrderStatus.Shipped, 
        schemas.OrderStatus.In_Transit
    ]
    delayed_count = db.query(func.count(models.Order.id)).filter(
        models.Order.status.in_(delayed_statuses)
    ).scalar() or 0
    
    delivery_status = {"on_time": delivered_orders, "delayed": delayed_count}

    # 6. Status Breakdown
    status_counts_query = db.query(
        models.Order.status, 
        func.count(models.Order.id).label("status_count")
    ).group_by(models.Order.status).all()
    
    order_status_breakdown = [{"status": status.value, "value": count} for status, count in status_counts_query]

    return {
        "kpi_cards": kpi_cards,
        "top_selling_products": top_selling_products,
        "delivery_status": delivery_status,
        "order_status_breakdown": order_status_breakdown
    }

# --- CSV EXPORT ENDPOINTS ---

@router.get("/export-summary-csv")
def export_summary_csv(db: Session = Depends(get_db)):
    summary = get_analytics_summary(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])
    for card in summary["kpi_cards"]:
        writer.writerow([card["title"], card["value"]])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename=summary_report_{date.today()}.csv"}
    )

@router.get("/export-monthly-csv")
def export_monthly_csv(db: Session = Depends(get_db)):
    latest_date = db.query(func.max(models.Order.order_date)).scalar()
    if not latest_date:
        return {"message": "No data found to export"}

    query = db.query(
        cast(models.Order.order_date, Date).label("date"),
        models.Product.name.label("product"),
        models.OrderItem.quantity,
        models.Order.total_amount.label("revenue")
    ).join(models.OrderItem, models.Order.id == models.OrderItem.order_id)\
     .join(models.Product, models.OrderItem.product_id == models.Product.id)\
     .filter(extract('year', models.Order.order_date) == latest_date.year)\
     .filter(extract('month', models.Order.order_date) == latest_date.month)\
     .all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Product", "Quantity", "Revenue"])
    for row in query:
        writer.writerow([row.date, row.product, row.quantity, f"{row.revenue:.2f}"])
    
    output.seek(0)
    filename = f"{month_abbr[latest_date.month].lower()}_{latest_date.year}_data.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export-yearly-csv")
def export_yearly_csv(db: Session = Depends(get_db)):
    query = db.query(
        cast(models.Order.order_date, Date).label("date"),
        models.Product.name.label("product"),
        models.OrderItem.quantity,
        models.Order.total_amount.label("revenue")
    ).join(models.OrderItem, models.Order.id == models.OrderItem.order_id)\
     .join(models.Product, models.OrderItem.product_id == models.Product.id)\
     .all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Product", "Quantity", "Revenue"])
    for row in query:
        writer.writerow([row.date, row.product, row.quantity, f"{row.revenue:.2f}"])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=expanded_supply_chain_data.csv"}
    )

# --- TIME SERIES ENDPOINTS ---

@router.get("/low-stock-products", response_model=LowStockProductResponse)
def get_low_stock_product_details(db: Session = Depends(get_db)):
    low_stock_threshold = get_low_stock_threshold(db)
    products_query = db.query(
        models.Product.name, 
        models.Product.stock_quantity
    ).filter(
        models.Product.stock_quantity <= low_stock_threshold, 
        models.Product.stock_quantity > 0
    ).order_by(models.Product.stock_quantity.asc()).all()
    
    return {"data": [{"name": p.name, "stock_quantity": p.stock_quantity} for p in products_query]}

@router.get("/revenue-over-time", response_model=RevenueOverTimeResponse)
def get_revenue_over_time(days: int = 30, db: Session = Depends(get_db)):
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)
    
    revenue_query = db.query(
        cast(models.Order.order_date, Date).label("order_day"),
        func.sum(models.Order.total_amount).label("daily_revenue")
    ).filter(
        cast(models.Order.order_date, Date) >= start_date,
        cast(models.Order.order_date, Date) <= end_date
    ).group_by(cast(models.Order.order_date, Date)).all()

    date_range = [start_date + timedelta(days=i) for i in range(days)]
    revenue_map = {day: 0.0 for day in date_range}
    
    for day, daily_revenue in revenue_query:
        if day in revenue_map:
            revenue_map[day] = daily_revenue if daily_revenue is not None else 0.0
            
    return {"data": [{"date": d, "revenue": r} for d, r in revenue_map.items()]}

@router.get("/monthly-revenue", response_model=MonthlyRevenueResponse)
def get_monthly_revenue(months: int = 6, db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_month_date = today.replace(day=1)
    for _ in range(months - 1):
        start_month_date = (start_month_date - timedelta(days=1)).replace(day=1)

    revenue_query = db.query(
        extract('year', models.Order.order_date).label("year"),
        extract('month', models.Order.order_date).label("month"),
        func.sum(models.Order.total_amount).label("revenue")
    ).filter(models.Order.order_date >= start_month_date)\
     .group_by("year", "month").all()

    revenue_map: Dict[str, float] = {}
    curr = start_month_date
    while curr <= today:
        month_key = curr.strftime("%Y-%m")
        revenue_map[month_key] = 0.0
        # Jump to next month
        curr = (curr.replace(day=28) + timedelta(days=4)).replace(day=1)

    for r in revenue_query:
        month_key = f"{int(r.year)}-{int(r.month):02d}"
        if month_key in revenue_map:
            revenue_map[month_key] = r.revenue or 0.0

    result = []
    for m_key in sorted(revenue_map.keys()):
        y, m_num = map(int, m_key.split('-'))
        result.append({"month": month_abbr[m_num], "revenue": revenue_map[m_key]})
        
    return {"data": result}