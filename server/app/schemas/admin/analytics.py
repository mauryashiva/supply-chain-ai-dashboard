from pydantic import BaseModel, ConfigDict
from typing import List

class KpiCard(BaseModel):
    title: str
    value: str
    change: str

class TopProduct(BaseModel):
    name: str
    value: int

class DeliveryStatusChart(BaseModel):
    on_time: int
    delayed: int

class OrderStatusBreakdownItem(BaseModel):
    status: str
    value: int

class AnalyticsSummary(BaseModel):
    kpi_cards: List[KpiCard]
    top_selling_products: List[TopProduct]
    delivery_status: DeliveryStatusChart
    order_status_breakdown: List[OrderStatusBreakdownItem]
    model_config = ConfigDict(from_attributes=True)