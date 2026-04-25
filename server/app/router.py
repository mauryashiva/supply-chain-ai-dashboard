# app/router.py
from fastapi import APIRouter

# Import Admin Routers
from .api.admin import (
    analytics, inventory, orders, logistics, 
    users, ai, settings, forecasting
)

# Import Customer Routers
from .api.customer import catalog as customer_catalog
from .api.customer import orders as customer_orders
from .api.customer import payments as customer_payments
from .api.customer import address as customer_address

# Import Shared Routers
from .api import auth

# The Master Router
api_router = APIRouter()

# --- ADMIN DOMAIN (Prefix: /api/admin) ---
admin_prefix = "/api/admin"
api_router.include_router(analytics.router, prefix=f"{admin_prefix}/analytics", tags=["Admin Analytics"])
api_router.include_router(inventory.router, prefix=f"{admin_prefix}/inventory", tags=["Admin Inventory"])
api_router.include_router(orders.router, prefix=f"{admin_prefix}/orders", tags=["Admin Orders"])
api_router.include_router(logistics.router, prefix=f"{admin_prefix}/logistics", tags=["Admin Logistics"])
api_router.include_router(users.router, prefix=f"{admin_prefix}/users", tags=["Admin Users"])
api_router.include_router(ai.router, prefix=f"{admin_prefix}/ai", tags=["Admin AI"])
api_router.include_router(settings.router, prefix=f"{admin_prefix}/settings", tags=["Admin Settings"])
api_router.include_router(forecasting.router, prefix=f"{admin_prefix}/forecast", tags=["Admin Forecasting"])

# --- CUSTOMER DOMAIN (Prefix: /api/customer) ---
customer_prefix = "/api/customer"
api_router.include_router(customer_catalog.router, prefix=f"{customer_prefix}/catalog", tags=["Customer Catalog"])
api_router.include_router(customer_orders.router, prefix=f"{customer_prefix}/orders", tags=["Customer Orders"])
api_router.include_router(customer_payments.router, prefix=f"{customer_prefix}/payments", tags=["Customer Payments"])
api_router.include_router(customer_address.router, prefix=f"{customer_prefix}/address", tags=["Customer Address"])

# --- SHARED DOMAIN (Prefix: /api/auth) ---
api_router.include_router(auth.router, prefix="/api/auth", tags=["Auth"])