# app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Trigger model registration
from . import models 

# Import the manager and the new master router
from .core.websocket_manager import manager
from .router import api_router

app = FastAPI(title="Supply Chain AI Dashboard API")

# ================================
# CORS & Middlewares
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://supply-chain-ai-dashboard-customer.vercel.app",
        "https://supply-chain-ai-dashboard-admin.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# WebSockets
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
# PLUG IN THE MASTER ROUTER
# ================================
app.include_router(api_router)

# ================================
# UTILITY ROUTES (Keep these here)
# ================================
@app.get("/ping")
async def ping():
    return {"status": "alive"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Supply Chain AI Dashboard API is running."}