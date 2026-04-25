# app/models/__init__.py
from .shared import User, UserRole
from .customer.address import Address
from .admin.inventory import Product, ProductImage, MediaType
from .admin.order import Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, DiscountType, ShippingProvider
from .admin.logistics import Vehicle
from .admin.settings import AppSettings

# This "re-exports" everything so other files can just import 'models'
__all__ = [
    "User", "UserRole", "Address", "Product", "ProductImage", 
    "MediaType", "Order", "OrderItem", "OrderStatus", 
    "PaymentStatus", "PaymentMethod", "DiscountType", 
    "ShippingProvider", "Vehicle", "AppSettings"
]