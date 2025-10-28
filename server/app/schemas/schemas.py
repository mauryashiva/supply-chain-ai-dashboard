from pydantic import BaseModel, validator
from typing import Optional, List, Dict # Added Dict
from datetime import datetime
from enum import Enum

# --- Enums ---
class UserRole(str, Enum):
    admin = "admin"; user = "user"
class DiscountType(str, Enum):
    percentage = "percentage"; fixed = "fixed"
class OrderStatus(str, Enum):
    Pending = "Pending"; Processing = "Processing"; Shipped = "Shipped"; In_Transit = "In Transit"; Delivered = "Delivered"; Cancelled = "Cancelled"; Returned = "Returned"
class PaymentStatus(str, Enum):
    Paid = "Paid"; Unpaid = "Unpaid"; Pending = "Pending"; COD = "COD"; Refunded = "Refunded"
class PaymentMethod(str, Enum):
    Credit_Card = "Credit Card"; Debit_Card = "Debit Card"; UPI = "UPI"; Net_Banking = "Net Banking"; Wallet = "Wallet"; COD = "COD"
class ShippingProvider(str, Enum):
    Self_Delivery = "Self-Delivery"; BlueDart = "BlueDart"; Delhivery = "Delhivery"; DTDC = "DTDC"
class StockStatus(str, Enum):
    In_Stock = "In Stock"; Low_Stock = "Low Stock"; Out_of_Stock = "Out of Stock"
class MediaType(str, Enum):
    image = "image"; video = "video"

# --- Product Schemas ---
class ProductImageResponse(BaseModel):
    id: int; media_url: str; media_type: MediaType
    class Config: from_attributes = True
class ProductImageCreate(BaseModel):
    media_url: str; media_type: MediaType = MediaType.image

# --- YAHAN BADLAAV KIYA GAYA HAI ---
class ProductBase(BaseModel):
    name: str; sku: str; stock_quantity: int
    # --- 'status' ko yahan se hata diya gaya hai ---
    description: Optional[str] = None; category: Optional[str] = None; supplier: Optional[str] = None
    reorder_level: Optional[int] = None; cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = 0.0
    last_restocked: Optional[datetime] = None

class ProductCreate(ProductBase):
    # 'status' yahan se automatically hatt gaya hai
    images: List[ProductImageCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None; stock_quantity: Optional[int] = None
    # --- 'status' ko yahan se hata diya gaya hai ---
    description: Optional[str] = None; category: Optional[str] = None; supplier: Optional[str] = None
    reorder_level: Optional[int] = None; cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = None
    last_restocked: Optional[datetime] = None
    images: Optional[List[ProductImageCreate]] = None

class Product(ProductBase):
    id: int; images: List[ProductImageResponse] = []
    # --- 'status' ko yahan wapas add kiya gaya hai (calculated field ke liye) ---
    status: StockStatus
    class Config: from_attributes = True


# --- Order Item Schemas (Unchanged) ---
class ItemProductDetail(BaseModel):
    name: str; sku: str
    class Config: from_attributes = True
class ItemInOrder(BaseModel):
    quantity: int; product: ItemProductDetail
    class Config: from_attributes = True


# --- User & Vehicle Schemas (Unchanged) ---
class UserBase(BaseModel):
    name: str; email: str; role: UserRole = UserRole.user
class UserCreate(UserBase):
    password: str
class UserUpdate(BaseModel):
    name: Optional[str] = None; email: Optional[str] = None; role: Optional[UserRole] = None; is_active: Optional[bool] = None
class User(UserBase):
    id: int; is_active: bool
    class Config: from_attributes = True
class VehicleBase(BaseModel):
    vehicle_number: str; driver_name: str; latitude: float; longitude: float; status: str
    live_temp: float; orders_count: int; fuel_level: float
class Vehicle(VehicleBase):
    id: int
    class Config: from_attributes = True


# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    product_id: int; quantity: int

class OrderBase(BaseModel):
    customer_name: str; customer_email: str
    # --- ADD THIS LINE ---
    phone_number: Optional[str] = None # Optional phone number
    # --- END ADD ---
    shipping_address: str

    # --- NEW & UPDATED FINANCIAL FIELDS ---
    subtotal: float
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    total_gst: float
    shipping_charges: Optional[float] = 0.0
    total_amount: float # Replaces 'amount'

    # --- EXISTING FIELDS (UNCHANGED) ---
    payment_status: PaymentStatus = PaymentStatus.Unpaid
    payment_method: PaymentMethod
    status: OrderStatus = OrderStatus.Pending
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    shipping_address: str
    payment_method: PaymentMethod

    # --- EXISTING OPTIONAL FIELDS (PRESERVED) ---
    payment_status: Optional[PaymentStatus] = None
    status: Optional[OrderStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

    # --- NEW MANUALLY ENTERED FINANCIAL FIELDS (ADDED) ---
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    shipping_charges: Optional[float] = 0.0

    # --- LIST OF ITEMS (UNCHANGED) ---
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None; payment_status: Optional[PaymentStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None
    @validator("shipping_provider", pre=True)
    def empty_str_to_none(cls, v):
        if v == "": return None
        return v

class ItemProductDetailWithPrice(BaseModel):
    name: str
    sku: str
    selling_price: float
    gst_rate: float
    class Config:
        from_attributes = True

class ItemInOrderResponse(BaseModel):
    quantity: int
    product: ItemProductDetailWithPrice
    class Config:
        from_attributes = True

class Order(OrderBase):
    id: int; order_date: datetime; items: List[ItemInOrderResponse]
    class Config: from_attributes = True

# --- App Settings Schemas (Unchanged) ---
class AppSetting(BaseModel):
    setting_key: str; setting_value: str
    class Config: from_attributes = True
class AppSettingsUpdate(BaseModel):
    settings: List[AppSetting]

# --- Analytics Schemas ---
class KpiCard(BaseModel):
    title: str; value: str; change: str
class TopProduct(BaseModel):
    name: str; value: int
class DeliveryStatusChart(BaseModel):
    on_time: int; delayed: int

# --- NEW SCHEMA ---
class OrderStatusBreakdownItem(BaseModel):
    status: str # e.g., "Pending", "Processing"
    value: int  # Count for that status

class AnalyticsSummary(BaseModel):
    kpi_cards: List[KpiCard] # Updated type hint based on KpiCard model
    top_selling_products: List[TopProduct] # Updated type hint based on TopProduct model
    delivery_status: DeliveryStatusChart # Updated type hint based on DeliveryStatusChart model
    # --- ADDED THIS NEW FIELD ---
    order_status_breakdown: List[OrderStatusBreakdownItem]

    class Config:
        from_attributes = True # Updated from orm_mode for Pydantic v2 consistency

class ForecastDataPoint(BaseModel):
    date: str; value: int
class DemandForecast(BaseModel):
    forecast: List[ForecastDataPoint]