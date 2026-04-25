import io
import csv
from datetime import datetime, timedelta, date, timezone
from calendar import month_abbr
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, Date, cast, extract
from pydantic import BaseModel, ConfigDict

# Modular relative imports
from ...database import get_db
from ...schemas.admin import analytics as analytics_schemas
from ...models.admin import inventory as inventory_models
from ...models.admin import order as order_models
from ..auth import get_current_user
from ...utils.settings_helpers import get_low_stock_threshold

router = APIRouter(dependencies=[Depends(get_current_user)])

# --- INTERNAL SCHEMAS ---

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
    model_config = ConfigDict(from_attributes=True)

class LowStockProductResponse(BaseModel):
    data: List[LowStockProduct]

# --- ANALYTICS ENDPOINTS ---

@router.get("/summary", response_model=analytics_schemas.AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Calculates and returns key system-wide metrics and distributions.
    """
    threshold = get_low_stock_threshold(db)

    # 1. Base KPI Calculations
    total_orders = db.query(func.count(order_models.Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(order_models.Order.total_amount)).scalar() or 0.0
    
    pending_orders = db.query(func.count(order_models.Order.id)).filter(
        order_models.Order.status == "Pending"
    ).scalar() or 0
    
    delivered_orders = db.query(func.count(order_models.Order.id)).filter(
        order_models.Order.status == "Delivered"
    ).scalar() or 0
    
    low_stock_count = db.query(func.count(inventory_models.Product.id)).filter(
        inventory_models.Product.stock_quantity <= threshold,
        inventory_models.Product.stock_quantity > 0
    ).scalar() or 0

    total_inventory_val = db.query(
        func.sum(inventory_models.Product.stock_quantity * func.coalesce(inventory_models.Product.cost_price, 0.0))
    ).filter(inventory_models.Product.stock_quantity > 0).scalar() or 0.0

    # 2. Structure KPI Cards
    kpi_cards = [
        {"title": "Total Orders", "value": f"{total_orders:,}", "change": ""},
        {"title": "Revenue", "value": f"₹{total_revenue:,.2f}", "change": ""},
        {"title": "Inventory Value", "value": f"₹{total_inventory_val:,.2f}", "change": ""},
        {"title": "Pending Orders", "value": str(pending_orders), "change": ""},
        {"title": "Low Stock Items", "value": str(low_stock_count), "change": ""},
    ]

    # 3. Top Products by Volume
    top_query = db.query(
        inventory_models.Product.name,
        func.sum(order_models.OrderItem.quantity).label("total_quantity")
    ).join(order_models.OrderItem, order_models.OrderItem.product_id == inventory_models.Product.id)\
     .group_by(inventory_models.Product.name)\
     .order_by(func.sum(order_models.OrderItem.quantity).desc())\
     .limit(5).all()
    
    top_selling = [{"name": name, "value": int(qty)} for name, qty in top_query]

    # 4. Delivery Status logic
    delayed_statuses = ["Pending", "Processing", "Shipped", "In Transit"]
    delayed_count = db.query(func.count(order_models.Order.id)).filter(
        order_models.Order.status.in_(delayed_statuses)
    ).scalar() or 0
    
    delivery_status = {"on_time": delivered_orders, "delayed": delayed_count}

    # 5. Full Status Breakdown
    status_counts = db.query(
        order_models.Order.status, 
        func.count(order_models.Order.id).label("count")
    ).group_by(order_models.Order.status).all()
    
    breakdown = [{"status": str(s), "value": c} for s, c in status_counts]

    return {
        "kpi_cards": kpi_cards,
        "top_selling_products": top_selling,
        "delivery_status": delivery_status,
        "order_status_breakdown": breakdown
    }

@router.get("/revenue-over-time", response_model=RevenueOverTimeResponse)
def get_revenue_timeline(days: int = 30, db: Session = Depends(get_db)):
    """
    Returns revenue data point by day for line charts. 
    Correctly handles UTC timezones.
    """
    # FIX: Using timezone.utc instead of timedelta(0)
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days - 1)
    
    query = db.query(
        cast(order_models.Order.order_date, Date).label("day"),
        func.sum(order_models.Order.total_amount).label("rev")
    ).filter(
        cast(order_models.Order.order_date, Date) >= start,
        cast(order_models.Order.order_date, Date) <= end
    ).group_by("day").all()

    # Fill missing days with 0.0 for smooth charts
    date_range = [start + timedelta(days=i) for i in range(days)]
    revenue_map = {d: 0.0 for d in date_range}
    
    for d, r in query:
        if d in revenue_map:
            revenue_map[d] = float(r or 0.0)
            
    return {"data": [{"date": d, "revenue": r} for d, r in revenue_map.items()]}

@router.get("/monthly-revenue", response_model=MonthlyRevenueResponse)
def get_monthly_revenue(months: int = 6, db: Session = Depends(get_db)):
    """
    Returns revenue data grouped by month.
    """
    # FIX: Using timezone.utc instead of timedelta(0)
    today = datetime.now(timezone.utc).date()
    start_date = today.replace(day=1)
    for _ in range(months - 1):
        start_date = (start_date - timedelta(days=1)).replace(day=1)

    query = db.query(
        extract('year', order_models.Order.order_date).label("y"),
        extract('month', order_models.Order.order_date).label("m"),
        func.sum(order_models.Order.total_amount).label("rev")
    ).filter(order_models.Order.order_date >= start_date)\
     .group_by("y", "m").all()

    # Generate sequential month list to ensure no gaps in the chart
    rev_map: Dict[str, float] = {}
    curr = start_date
    while curr <= today:
        key = curr.strftime("%Y-%m")
        rev_map[key] = 0.0
        # Jump to next month
        curr = (curr.replace(day=28) + timedelta(days=4)).replace(day=1)

    for r in query:
        key = f"{int(r.y)}-{int(r.m):02d}"
        if key in rev_map:
            rev_map[key] = float(r.rev or 0.0)

    result = []
    for k in sorted(rev_map.keys()):
        m_num = int(k.split('-')[1])
        result.append({"month": month_abbr[m_num], "revenue": rev_map[k]})
        
    return {"data": result}

@router.get("/low-stock-products", response_model=LowStockProductResponse)
def get_low_stock_details(db: Session = Depends(get_db)):
    threshold = get_low_stock_threshold(db)
    items = db.query(
        inventory_models.Product.name, 
        inventory_models.Product.stock_quantity
    ).filter(
        inventory_models.Product.stock_quantity <= threshold, 
        inventory_models.Product.stock_quantity > 0
    ).order_by(inventory_models.Product.stock_quantity.asc()).all()
    
    return {"data": [{"name": i.name, "stock_quantity": i.stock_quantity} for i in items]}

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