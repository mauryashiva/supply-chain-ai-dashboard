# app/schemas/admin/forecast.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class ForecastDataPoint(BaseModel):
    date: str
    day_name: str
    demand_estimate: float
    confidence_upper: float
    confidence_lower: float
    linear_forecast: float
    arima_forecast: float
    is_weekend: bool

class DemandForecast(BaseModel):
    product_id: Optional[int]
    model_confidence: float
    forecast: List[ForecastDataPoint]
    historical_summary: dict
    accuracy_metrics: dict

# 🔥 ADD THIS MODEL BELOW TO FIX THE ERROR
class TodayProductForecast(BaseModel):
    id: int
    name: str
    sku: str
    predicted_demand: int
    current_stock: int
    stock_status: str
    confidence_score: float
    avg_daily_demand: float
    days_of_stock: int

    model_config = ConfigDict(from_attributes=True)