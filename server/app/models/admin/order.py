import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from ...database import Base

# --- ENUMS ---

class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class OrderStatus(str, enum.Enum):
    Pending = "Pending"
    Processing = "Processing"
    Shipped = "Shipped"
    In_Transit = "In Transit"
    Delivered = "Delivered"
    Cancelled = "Cancelled"
    Returned = "Returned"

class PaymentStatus(str, enum.Enum):
    Paid = "Paid"
    Unpaid = "Unpaid"
    Pending = "Pending"
    COD = "COD"
    Refunded = "Refunded"

class PaymentMethod(str, enum.Enum):
    Credit_Card = "Credit Card"
    Debit_Card = "Debit Card"
    UPI = "UPI"
    Net_Banking = "Net Banking"
    Wallet = "Wallet"
    COD = "COD"

class ShippingProvider(str, enum.Enum):
    Self_Delivery = "Self-Delivery"
    BlueDart = "BlueDart"
    Delhivery = "Delhivery"
    DTDC = "DTDC"

# --- MODELS ---

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Legacy/Snapshot Fields
    customer_name = Column(String, index=True, nullable=True)
    customer_email = Column(String, index=True, nullable=True)
    phone_number = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)

    # Financials
    subtotal = Column(Float)
    discount_value = Column(Float, default=0.0)
    discount_type = Column(Enum(DiscountType), nullable=True)
    total_gst = Column(Float)
    shipping_charges = Column(Float, default=0.0)
    total_amount = Column(Float)

    # Statuses
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.Unpaid)
    payment_method = Column(Enum(PaymentMethod))
    status = Column(Enum(OrderStatus), default=OrderStatus.Pending)
    shipping_provider = Column(Enum(ShippingProvider), nullable=True)
    tracking_id = Column(String, nullable=True, index=True)

    # --- RELATIONSHIPS (FIXED FOR MODULARITY) ---
    # We use the literal class names "User" and "Address"
    # SQLAlchemy finds these in the global registry loaded via __init__.py
    user = relationship("User", back_populates="orders")
    address = relationship("Address") 
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = 'order_items'

    order_id = Column(Integer, ForeignKey('orders.id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), primary_key=True)
    quantity = Column(Integer, nullable=False)

    # --- RELATIONSHIPS (FIXED FOR MODULARITY) ---
    order = relationship("Order", back_populates="items")
    product = relationship("Product") # Points to the Product class in inventory.py
    
    # Snapshot fields
    product_name = Column(String, nullable=True)
    product_sku = Column(String, nullable=True)
    unit_price = Column(Float, nullable=True)
    gst_rate = Column(Float, nullable=True)
    gst_amount = Column(Float, nullable=True)
    subtotal = Column(Float, nullable=True)