from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from ..shared.user import User
from ..customer.address import Address

class DiscountType(str, Enum):
    percentage = "percentage"
    fixed = "fixed"

class OrderStatus(str, Enum):
    Pending = "Pending"
    Processing = "Processing"
    Shipped = "Shipped"
    In_Transit = "In Transit"
    Delivered = "Delivered"
    Cancelled = "Cancelled"
    Returned = "Returned"

class PaymentStatus(str, Enum):
    Paid = "Paid"
    Unpaid = "Unpaid"
    Pending = "Pending"
    COD = "COD"
    Refunded = "Refunded"

class PaymentMethod(str, Enum):
    Credit_Card = "Credit Card"
    Debit_Card = "Debit Card"
    UPI = "UPI"
    Net_Banking = "Net Banking"
    Wallet = "Wallet"
    COD = "COD"

class ShippingProvider(str, Enum):
    Self_Delivery = "Self-Delivery"
    BlueDart = "BlueDart"
    Delhivery = "Delhivery"
    DTDC = "DTDC"

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class ItemProductDetail(BaseModel):
    name: str
    sku: str
    selling_price: float
    gst_rate: float
    model_config = ConfigDict(from_attributes=True)

class ItemInOrderResponse(BaseModel):
    quantity: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    unit_price: Optional[float] = None
    gst_rate: Optional[float] = None
    gst_amount: Optional[float] = None
    subtotal: Optional[float] = None
    product: ItemProductDetail
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    subtotal: float
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    total_gst: float
    shipping_charges: Optional[float] = 0.0
    total_amount: float
    payment_status: PaymentStatus = PaymentStatus.Unpaid
    payment_method: PaymentMethod
    status: OrderStatus = OrderStatus.Pending
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

class OrderCreate(BaseModel):
    address_id: int
    payment_method: PaymentMethod
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    shipping_charges: Optional[float] = 0.0
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

    @field_validator("shipping_provider", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == "" else v

class Order(OrderBase):
    id: int
    order_date: datetime
    address: Optional[Address]
    items: List[ItemInOrderResponse]
    user: Optional[User]
    model_config = ConfigDict(from_attributes=True)