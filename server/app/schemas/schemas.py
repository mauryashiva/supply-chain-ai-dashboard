from pydantic import BaseModel, validator
from typing import Optional, List, Dict # Import Dict
from datetime import datetime
from enum import Enum

# --- Enums ---
# Define all string enums used for type hinting and validation

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

# Schema for responding with product image details
class ProductImageResponse(BaseModel):
    id: int; media_url: str; media_type: MediaType
    class Config: from_attributes = True # Allow Pydantic to read from ORM models

# Schema for creating a new product image (part of ProductCreate)
class ProductImageCreate(BaseModel):
    media_url: str; media_type: MediaType = MediaType.image

# Base schema for Product, contains common fields
class ProductBase(BaseModel):
    name: str; sku: str; stock_quantity: int
    # 'status' is removed here as it will be calculated dynamically
    description: Optional[str] = None; category: Optional[str] = None; supplier: Optional[str] = None
    reorder_level: Optional[int] = None; cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = 0.0 # Default GST rate to 0.0
    last_restocked: Optional[datetime] = None

# Schema for creating a new product
class ProductCreate(ProductBase):
    images: List[ProductImageCreate] = [] # List of images to create

# Schema for updating an existing product (all fields optional)
class ProductUpdate(BaseModel):
    name: Optional[str] = None; stock_quantity: Optional[int] = None
    # 'status' is removed here
    description: Optional[str] = None; category: Optional[str] = None; supplier: Optional[str] = None
    reorder_level: Optional[int] = None; cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = None
    last_restocked: Optional[datetime] = None
    images: Optional[List[ProductImageCreate]] = None

# Schema for responding with a full product object
class Product(ProductBase):
    id: int; images: List[ProductImageResponse] = []
    # 'status' is added back here, as it will be populated by the API logic
    status: StockStatus 
    class Config: from_attributes = True


# --- Order Item Schemas ---

# Schema for nested product details within an order item
class ItemProductDetail(BaseModel):
    name: str; sku: str
    class Config: from_attributes = True

# Schema for an item within an order (read-only)
class ItemInOrder(BaseModel):
    quantity: int; product: ItemProductDetail
    class Config: from_attributes = True


# --- User & Vehicle Schemas ---

# Base schema for a User
class UserBase(BaseModel):
    name: str; email: str; role: UserRole = UserRole.user
# Schema for creating a new user (requires password)
class UserCreate(UserBase):
    password: str
# Schema for updating a user (all fields optional)
class UserUpdate(BaseModel):
    name: Optional[str] = None; email: Optional[str] = None; role: Optional[UserRole] = None; is_active: Optional[bool] = None
# Schema for responding with a full user object
class User(UserBase):
    id: int; is_active: bool
    class Config: from_attributes = True

# Base schema for a Vehicle
class VehicleBase(BaseModel):
    vehicle_number: str; driver_name: str; latitude: float; longitude: float; status: str
    live_temp: float; orders_count: int; fuel_level: float
# Schema for responding with a full vehicle object
class Vehicle(VehicleBase):
    id: int
    class Config: from_attributes = True


# --- Order Schemas ---

# Schema for creating a new order item (part of OrderCreate)
class OrderItemCreate(BaseModel):
    product_id: int; quantity: int

# Base schema for an Order, contains calculated financial fields
class OrderBase(BaseModel):
    customer_name: str; customer_email: str
    phone_number: Optional[str] = None # Optional phone number
    shipping_address: str

    # Server-calculated financial fields
    subtotal: float
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    total_gst: float
    shipping_charges: Optional[float] = 0.0
    total_amount: float # The final calculated total

    # Fulfillment fields
    payment_status: PaymentStatus = PaymentStatus.Unpaid
    payment_method: PaymentMethod
    status: OrderStatus = OrderStatus.Pending
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

# Schema for creating a new order (payload from client)
class OrderCreate(BaseModel):
    # Required customer info
    customer_name: str
    customer_email: str
    phone_number: Optional[str] = None
    shipping_address: str
    payment_method: PaymentMethod

    # Optional fulfillment info
    payment_status: Optional[PaymentStatus] = None
    status: Optional[OrderStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

    # Manually entered financial adjustments
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    shipping_charges: Optional[float] = 0.0

    # List of items to be ordered
    items: List[OrderItemCreate]

# Schema for updating an order (only fulfillment details)
class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None; payment_status: Optional[PaymentStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None
    
    # Validator to convert empty strings to None (e.g., from a form)
    @validator("shipping_provider", pre=True)
    def empty_str_to_none(cls, v):
        if v == "": return None
        return v

# Schema for nested product details in an Order response (includes financial info)
class ItemProductDetailWithPrice(BaseModel):
    name: str
    sku: str
    selling_price: float
    gst_rate: float
    class Config:
        from_attributes = True

# Schema for an item in an Order response
class ItemInOrderResponse(BaseModel):
    quantity: int
    product: ItemProductDetailWithPrice
    class Config:
        from_attributes = True

# Schema for responding with a full order object
class Order(OrderBase):
    id: int; order_date: datetime; items: List[ItemInOrderResponse]
    class Config: from_attributes = True

# --- App Settings Schemas ---
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

# Schema for an item in the order status breakdown
class OrderStatusBreakdownItem(BaseModel):
    status: str # e.g., "Pending", "Processing"
    value: int  # Count for that status

# Schema for the main analytics summary response
class AnalyticsSummary(BaseModel):
    kpi_cards: List[KpiCard]
    top_selling_products: List[TopProduct]
    delivery_status: DeliveryStatusChart
    order_status_breakdown: List[OrderStatusBreakdownItem] # Added field

    class Config:
        from_attributes = True

# --- Forecast Schemas ---
class ForecastDataPoint(BaseModel):
    date: str; value: int
class DemandForecast(BaseModel):
    forecast: List[ForecastDataPoint]