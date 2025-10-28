from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import models
from .api import analytics, inventory, orders, logistics, users, ai, settings, forecasting
from .bulk import bulk_inventory, bulk_orders

# Create all database tables on app startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supply Chain AI Dashboard API")

# --- YAHAN BADLAAV KIYA GAYA HAI ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    # Authorization header ko explicitly allow karein taaki token aa sake
    allow_headers=["*", "Authorization"], 
)
# --- BADLAAV KHATAM ---

# API Routers
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(logistics.router, prefix="/api/logistics", tags=["Logistics"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(forecasting.router, prefix="/api", tags=["Forecasting"])

# Bulk routers (Aapke code ke hisaab se)
app.include_router(bulk_inventory.router, prefix="/api")
app.include_router(bulk_orders.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Supply Chain AI Dashboard API!"}