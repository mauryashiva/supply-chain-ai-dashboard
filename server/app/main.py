from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import models
# Import all API router modules
from .api import analytics, inventory, orders, logistics, users, ai, settings, forecasting
# Import the specific bulk operation routers
from .bulk import bulk_inventory, bulk_orders
from .api.customer import catalog as customer_catalog

from .core.websocket_manager import manager
from fastapi import WebSocket, WebSocketDisconnect

from .api.customer import orders as customer_orders

from .api import auth



# Create all database tables (if they don't exist) on app startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supply Chain AI Dashboard API")

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the React frontend (e.g., from localhost:5173) to make requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174","http://127.0.0.1:5173",
    "http://127.0.0.1:5174"], # The address of the frontend app
    allow_credentials=True,
    allow_methods=["*"], # Allow all HTTP methods
    allow_headers=["*"], # Allow all headers
)

# 3. NOW you can define the WebSocket endpoint
@app.websocket("/ws/inventory")
async def websocket_endpoint(websocket: WebSocket):
    # Accept the incoming connection
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open by listening for any data
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Remove client when they disconnect or close the tab
        manager.disconnect(websocket)

# === API Routers ===
# Include all the modular API routers with their specific prefixes and tags for documentation.

app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(logistics.router, prefix="/api/logistics", tags=["Logistics"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(forecasting.router, prefix="/api", tags=["Forecasting"])
app.include_router(customer_catalog.router, prefix="/api/customer", tags=["Customer Storefront"])

app.include_router(customer_orders.router, prefix="/api/customer/orders", tags=["Customer Orders"])

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Include the refactored bulk routers. Their prefixes are defined in their own files
# (e.g., /bulk/inventory), so we just add the /api prefix here.
# Final paths will be: /api/bulk/inventory and /api/bulk/orders
app.include_router(bulk_inventory.router, prefix="/api")
app.include_router(bulk_orders.router, prefix="/api")


@app.get("/")
def read_root():
    """
    Root endpoint for the API.
    """
    return {"message": "Welcome to the Supply Chain AI Dashboard API!"}