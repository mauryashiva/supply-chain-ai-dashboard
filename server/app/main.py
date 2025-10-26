from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import models
# --- CHANGE 1: 'bulk' ko .api import se hataya ---
from .api import analytics, inventory, orders, logistics, users, ai, settings, forecasting
# --- CHANGE 2: Naye bulk modules ko unke naye folder se import kiya ---
from .bulk import bulk_inventory, bulk_orders


# Create all database tables on app startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supply Chain AI Dashboard API")

# CORS (Cross-Origin Resource Sharing)
# This allows our React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # The address of our frontend app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(logistics.router, prefix="/api/logistics", tags=["Logistics"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(forecasting.router, prefix="/api", tags=["Forecasting"])
# --- CHANGE 3: Purana 'bulk' router hata diya ---
# app.include_router(bulk.router, prefix="/api/bulk", tags=["Bulk Operations"]) # Yeh hatt gaya

# --- CHANGE 4: Naye inventory aur order routers ko include kiya ---
# Humne in routers mein pehle se prefix (/bulk/inventory, /bulk/orders) set kar diya tha.
# Yahan "/api" prefix add karne se complete path ban jayega:
# /api/bulk/inventory
# /api/bulk/orders
app.include_router(bulk_inventory.router, prefix="/api")
app.include_router(bulk_orders.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Supply Chain AI Dashboard API!"}

