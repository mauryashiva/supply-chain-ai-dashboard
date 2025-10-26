from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# --- Imports (No change here) ---
from sqlalchemy import func, case, Date, cast, extract
from pydantic import BaseModel
from typing import List, Dict
from ..database import get_db
from ..schemas import schemas
from ..models import models
import random
from datetime import datetime, timedelta, date
from calendar import month_abbr 

from ..utils.settings_helpers import get_low_stock_threshold

router = APIRouter()

# --- RevenueOverTime Schemas (No change) ---
class RevenueDataPoint(BaseModel):
    date: date
    revenue: float
class RevenueOverTimeResponse(BaseModel):
    data: List[RevenueDataPoint]

# --- Monthly Revenue Schemas (No change) ---
class MonthlyRevenueDataPoint(BaseModel):
    month: str
    revenue: float
class MonthlyRevenueResponse(BaseModel):
    data: List[MonthlyRevenueDataPoint]

# --- (NEW) Schema for Low Stock Product Details ---
# Yeh aapke Analytics page par list dikhane ke kaam aayega
class LowStockProduct(BaseModel):
    name: str
    stock_quantity: int
    
    class Config:
        from_attributes = True # Pydantic v2 ke liye

class LowStockProductResponse(BaseModel):
    data: List[LowStockProduct]

# --- /summary endpoint (UPDATED) ---
@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Calculates and returns key analytics summary data from the database.
    """

    # --- (UPDATED) LOW STOCK LOGIC ---
    # 1. Pehle dynamic threshold fetch karein
    low_stock_threshold = get_low_stock_threshold(db)

    # 2. KPI Cards Data (Revenue logic ko nahi chheda gaya hai)
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    pending_orders = db.query(func.count(models.Order.id)).filter(models.Order.status == schemas.OrderStatus.Pending).scalar() or 0
    delivered_orders = db.query(func.count(models.Order.id)).filter(models.Order.status == schemas.OrderStatus.Delivered).scalar() or 0
    
    # 3. (UPDATED) low_stock_items_count ab dynamic threshold use karega
    low_stock_items_count = db.query(func.count(models.Product.id)).filter(
        models.Product.stock_quantity <= low_stock_threshold, # <-- Badlaav yahaan hai
        models.Product.stock_quantity > 0
    ).scalar() or 0
    # --- END OF UPDATED LOGIC ---

    # Calculate Total Inventory Value (No change)
    total_inventory_value = db.query(
        func.sum(models.Product.stock_quantity * func.coalesce(models.Product.cost_price, 0.0))
    ).filter(
        models.Product.stock_quantity > 0 
    ).scalar() or 0.0

    kpi_cards = [
        {"title": "Total Orders", "value": f"{total_orders:,}", "change": ""},
        {"title": "Revenue", "value": f"₹{total_revenue:,.2f}", "change": ""},
        {"title": "Inventory Value", "value": f"₹{total_inventory_value:,.2f}", "change": ""},
        {"title": "Pending Orders", "value": str(pending_orders), "change": ""},
        # Yeh value ab dynamic hai
        {"title": "Low Stock Items", "value": str(low_stock_items_count), "change": ""},
    ]

    # 2. Top Selling Products (No change)
    top_products_query = db.query(
            models.Product.name,
            func.sum(models.OrderItem.quantity).label("total_quantity")
        ).join(models.OrderItem, models.OrderItem.product_id == models.Product.id)\
         .group_by(models.Product.name)\
         .order_by(func.sum(models.OrderItem.quantity).desc())\
         .limit(5)\
         .all()
    top_selling_products = [{"name": name, "value": qty} for name, qty in top_products_query]

    # 3. Delivery Status (No change)
    delayed_statuses = [ 
        schemas.OrderStatus.Pending, schemas.OrderStatus.Processing,
        schemas.OrderStatus.Shipped, schemas.OrderStatus.In_Transit,
    ]
    delayed_count = db.query(func.count(models.Order.id)).filter(
        models.Order.status.in_(delayed_statuses)
        ).scalar() or 0
    delivery_status = {"on_time": delivered_orders, "delayed": delayed_count}

    # 4. Order Status Breakdown (No change)
    status_counts_query = db.query(
            models.Order.status,
            func.count(models.Order.id).label("status_count")
        ).group_by(models.Order.status)\
         .order_by(models.Order.status)\
         .all()
    order_status_breakdown = [{"status": status.value, "value": count} for status, count in status_counts_query]

    return {
        "kpi_cards": kpi_cards,
        "top_selling_products": top_selling_products,
        "delivery_status": delivery_status,
        "order_status_breakdown": order_status_breakdown
    }

# --- (NEW) ENDPOINT FOR LOW STOCK PRODUCT LIST ---
@router.get("/low-stock-products", response_model=LowStockProductResponse)
def get_low_stock_product_details(db: Session = Depends(get_db)):
    """
    Returns a list of products that are currently low stock based on the
    user-defined dynamic threshold.
    """
    # 1. Dynamic threshold fetch karein
    low_stock_threshold = get_low_stock_threshold(db)
    
    # 2. Unn products ko query karein jo low stock hain
    products_query = db.query(
        models.Product.name,
        models.Product.stock_quantity
    ).filter(
        models.Product.stock_quantity <= low_stock_threshold,
        models.Product.stock_quantity > 0
    ).order_by(
        models.Product.stock_quantity.asc() # Taaki sabse kam waale upar dikhein
    ).all()

    # 3. Data ko response ke liye format karein
    product_list = [
        {"name": name, "stock_quantity": stock} 
        for name, stock in products_query
    ]
    
    return {"data": product_list}


# --- /revenue-over-time endpoint (No change) ---
@router.get("/revenue-over-time", response_model=RevenueOverTimeResponse)
def get_revenue_over_time(
    days: int = 30, # Default to last 30 days
    db: Session = Depends(get_db)
):
    """
    Calculates total revenue grouped by date for the specified number of past days.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1) # Inclusive date range

    revenue_query = db.query(
            cast(models.Order.order_date, Date).label("order_day"),
            func.sum(models.Order.total_amount).label("daily_revenue")
        ).filter(
            cast(models.Order.order_date, Date) >= start_date,
            cast(models.Order.order_date, Date) <= end_date
        ).group_by(
            cast(models.Order.order_date, Date)
        ).order_by(
            cast(models.Order.order_date, Date)
        ).all()

    date_range = [start_date + timedelta(days=i) for i in range(days)]
    revenue_map = {day: 0.0 for day in date_range}

    for day, daily_revenue in revenue_query:
        if day in revenue_map:
            revenue_map[day] = daily_revenue if daily_revenue is not None else 0.0

    revenue_data = [{"date": day, "revenue": revenue} for day, revenue in revenue_map.items()]

    return {"data": revenue_data}


# --- /monthly-revenue endpoint (No change) ---
@router.get("/monthly-revenue", response_model=MonthlyRevenueResponse)
def get_monthly_revenue(
    months: int = 6, # Default to last 6 months
    db: Session = Depends(get_db)
):
    """
    Calculates total revenue grouped by month for the specified number of past months.
    """
    today = datetime.utcnow().date()
    start_month_date = today.replace(day=1) 
    for _ in range(months - 1):
        start_month_date = (start_month_date - timedelta(days=1)).replace(day=1)

    revenue_query = db.query(
            extract('year', models.Order.order_date).label("order_year"),
            extract('month', models.Order.order_date).label("order_month"),
            func.sum(models.Order.total_amount).label("monthly_revenue")
        ).filter(
            models.Order.order_date >= start_month_date
        ).group_by(
            extract('year', models.Order.order_date),
            extract('month', models.Order.order_date)
        ).order_by(
            extract('year', models.Order.order_date),
            extract('month', models.Order.order_date)
        ).all()

    revenue_map: Dict[str, float] = {}
    current_date = start_month_date
    end_date = today
    
    while current_date <= end_date:
        month_key = current_date.strftime("%Y-%m")
        revenue_map[month_key] = 0.0
        last_day = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        current_date = last_day + timedelta(days=1)

    for year, month, monthly_revenue in revenue_query:
        month_key = f"{int(year)}-{int(month):02d}"
        if month_key in revenue_map:
            revenue_map[month_key] = monthly_revenue if monthly_revenue is not None else 0.0

    monthly_data = []
    for month_key in sorted(revenue_map.keys()):
        year, month_num = map(int, month_key.split('-'))
        month_abbr_name = month_abbr[month_num]
        monthly_data.append({"month": month_abbr_name, "revenue": revenue_map[month_key]})

    return {"data": monthly_data}


# # --- Demand Forecast Endpoint (No change) ---
# @router.get("/forecast", response_model=schemas.DemandForecast)
# def get_demand_forecast(db: Session = Depends(get_db)):
#     """ Provides dummy demand forecast data. """
#     forecast_data = []
#     today = datetime.now()
#     for i in range(30): # Generate forecast for next 30 days
#         future_date = today + timedelta(days=i)
#         value = int(100 + 20 * (1 + 0.8 * (future_date.weekday() / 6)) + random.uniform(-15, 15))
#         forecast_data.append({"date": future_date.strftime("%Y-%m-%d"), "value": max(0, value)})
#     return {"forecast": forecast_data}