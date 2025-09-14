from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import models
# CHANGE 1: Import the new 'settings' module
from .api import analytics, inventory, orders, logistics, users, ai, settings

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
# CHANGE 2: Include the new 'settings' router in the app
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Supply Chain AI Dashboard API!"}