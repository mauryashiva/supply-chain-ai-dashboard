from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum, Boolean, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from ..database import Base  # Import the declarative base from database config
import enum
import datetime

# --- Enums ---
# Define Python enums that will be used for database ENUM types.

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

# Enum for Discount Type
class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class OrderStatus(str, enum.Enum):
    Pending = "Pending"; Processing = "Processing"; Shipped = "Shipped"; In_Transit = "In Transit"; Delivered = "Delivered"; Cancelled = "Cancelled"; Returned = "Returned"

class PaymentStatus(str, enum.Enum):
    Paid = "Paid"; Unpaid = "Unpaid"; Pending = "Pending"; COD = "COD"; Refunded = "Refunded"

class PaymentMethod(str, enum.Enum):
    Credit_Card = "Credit Card"; Debit_Card = "Debit Card"; UPI = "UPI"; Net_Banking = "Net Banking"; Wallet = "Wallet"; COD = "COD"

class ShippingProvider(str, enum.Enum):
    Self_Delivery = "Self-Delivery"; BlueDart = "BlueDart"; Delhivery = "Delhivery"; DTDC = "DTDC"

# This Enum is defined but the corresponding column in Product is commented out,
# as status is calculated dynamically.
class StockStatus(str, enum.Enum):
    In_Stock = "In Stock"; Low_Stock = "Low Stock"; Out_of_Stock = "Out of Stock"

class MediaType(str, enum.Enum):
    image = "image"; video = "video"


# --- Association & Other Models ---

# Association table for the many-to-many relationship between Orders and Products
class OrderItem(Base):
    __tablename__ = 'order_items'
    order_id = Column(Integer, ForeignKey('orders.id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), primary_key=True)
    quantity = Column(Integer, nullable=False)
    
    # Relationships to link back to Order and Product models
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

# Model to store product images and videos, linked to a Product
class ProductImage(Base):
    __tablename__ = 'product_images'
    id = Column(Integer, primary_key=True, index=True)
    media_url = Column(String, nullable=False)
    media_type = Column(Enum(MediaType), default=MediaType.image)
    
    product_id = Column(Integer, ForeignKey('products.id'))
    product = relationship("Product", back_populates="images")


# --- Main Table Models ---

# User model for authentication and roles
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole, name="userrole"), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    hashed_password = Column(String)

# Product model for inventory items
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    stock_quantity = Column(Integer)
    # The 'status' column is commented out because it's calculated dynamically.
    # status = Column(Enum(StockStatus))
    
    description = Column(Text, nullable=True)
    category = Column(String, index=True, nullable=True)
    supplier = Column(String, nullable=True)
    reorder_level = Column(Integer, default=10, nullable=True)
    cost_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    gst_rate = Column(Float, nullable=True, default=0.0) # e.g., 18.0 for 18%
    
    last_restocked = Column(DateTime, nullable=True)

    # One-to-many relationship with ProductImage
    # 'cascade="all, delete-orphan"' ensures images are deleted when a product is deleted.
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

# Order model for customer orders
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    customer_name = Column(String, index=True)
    customer_email = Column(String, index=True)
    phone_number = Column(String, nullable=True) # Optional phone number
    shipping_address = Column(String)

    # --- NEW FINANCIAL FIELDS (Calculated by the server on creation) ---
    subtotal = Column(Float) # The total price of items before discounts or taxes.
    discount_value = Column(Float, default=0.0) # The value of the discount.
    discount_type = Column(Enum(DiscountType), nullable=True) # 'percentage' or 'fixed'.
    total_gst = Column(Float) # The total calculated GST amount for the order.
    shipping_charges = Column(Float, default=0.0) # Shipping costs for the order.
    total_amount = Column(Float) # The final payable amount.
    # --- END OF NEW FIELDS ---

    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.Unpaid)
    payment_method = Column(Enum(PaymentMethod))
    status = Column(Enum(OrderStatus), default=OrderStatus.Pending)
    shipping_provider = Column(Enum(ShippingProvider), nullable=True)
    tracking_id = Column(String, nullable=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    # Relationship to OrderItem association table
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

# Vehicle model for logistics and tracking
class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True)
    driver_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="Idle") # Could be an Enum(VehicleStatus)
    live_temp = Column(Float)
    orders_count = Column(Integer)
    fuel_level = Column(Float)

# Model for storing application-wide settings (e.g., low stock threshold)
class AppSettings(Base):
    __tablename__ = 'app_settings'
    
    setting_key = Column(String, primary_key=True, index=True)
    setting_value = Column(String, nullable=False)