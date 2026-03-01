# ================================
# FastAPI Core Imports
# ================================
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ================================
# Database Imports
# ================================
from .database import engine
from .models import models

# ================================
# API Router Imports
# ================================
from .api import analytics, inventory, orders, logistics, users, ai, settings, forecasting
from .api import auth

# Customer API Routers
from .api.customer import catalog as customer_catalog
from .api.customer import orders as customer_orders
from app.api.customer import address as customer_address_router

# Bulk Operation Routers
from .bulk import bulk_inventory, bulk_orders

# WebSocket Manager
from .core.websocket_manager import manager


# ================================
# FastAPI Application Initialization
# ================================
app = FastAPI(
    title="Supply Chain AI Dashboard API"
)


# ================================
# CORS Configuration
# Allows frontend applications to
# communicate with this API
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://supply-chain-ai-dashboard-customer.vercel.app",
        "https://supply-chain-ai-dashboard-admin.vercel.app",
        "https://supply-chain-ai-dashboard-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# WebSocket Endpoint
# Real-time inventory updates
# ================================
@app.websocket("/ws/inventory")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ================================
# API Routers
# ================================

# Analytics
app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"]
)

# Inventory
app.include_router(
    inventory.router,
    prefix="/api/inventory",
    tags=["Inventory"]
)

# Orders
app.include_router(
    orders.router,
    prefix="/api/orders",
    tags=["Orders"]
)

# Logistics
app.include_router(
    logistics.router,
    prefix="/api/logistics",
    tags=["Logistics"]
)

# Users
app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"]
)

# AI
app.include_router(
    ai.router,
    prefix="/api/ai",
    tags=["AI"]
)

# Settings
app.include_router(
    settings.router,
    prefix="/api/settings",
    tags=["Settings"]
)

# Forecasting
app.include_router(
    forecasting.router,
    prefix="/api",
    tags=["Forecasting"]
)

# ================================
# Customer Storefront APIs
# ================================

app.include_router(
    customer_catalog.router,
    prefix="/api/customer",
    tags=["Customer Storefront"]
)

app.include_router(
    customer_orders.router,
    prefix="/api/customer/orders",
    tags=["Customer Orders"]
)

app.include_router(
    customer_address_router.router,
    prefix="/api/customer/address",
    tags=["Customer Address"]
)


# ================================
# Authentication APIs
# ================================
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)


# ================================
# Bulk Operation APIs
# Final paths:
# /api/bulk/inventory
# /api/bulk/orders
# ================================
app.include_router(bulk_inventory.router, prefix="/api")
app.include_router(bulk_orders.router, prefix="/api")


# ================================
# Root Endpoint
# ================================
@app.get("/")
def read_root():
    """
    Root endpoint for the API.
    """
    return {
        "message": "Welcome to the Supply Chain AI Dashboard API!"
    }