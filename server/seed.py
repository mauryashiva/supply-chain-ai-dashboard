# server/seed.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.models import models
from app.database import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set!")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_products():
    print("Seeding products...")
    products_to_add = [
        # ... (aapke products waise hi rahenge) ...
    ]
    for product in products_to_add:
        existing_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
        if not existing_product:
            db.add(product)
            print(f"Product added: {product.name}")
        else:
            print(f"Product '{product.name}' already exists. Skipping.")
    db.commit()
    print("✅ Products seeding complete!")

# --- YEH NAYA FUNCTION ADD KIYA GAYA HAI ---
def seed_vehicles():
    print("Seeding vehicles...")
    vehicles_to_add = [
        models.Vehicle(vehicle_number="MH12AB1234", driver_name="Ramesh Kumar", latitude=18.5204, longitude=73.8567, status="Idle", live_temp=25.5, orders_count=0, fuel_level=80.0),
        models.Vehicle(vehicle_number="MH14CD5678", driver_name="Suresh Singh", latitude=18.5314, longitude=73.8446, status="Idle", live_temp=26.1, orders_count=0, fuel_level=75.5)
    ]

    for vehicle in vehicles_to_add:
        existing_vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_number == vehicle.vehicle_number).first()
        if not existing_vehicle:
            db.add(vehicle)
            print(f"Vehicle added: {vehicle.vehicle_number}")
        else:
            print(f"Vehicle '{vehicle.vehicle_number}' already exists. Skipping.")

    db.commit()
    print("✅ Vehicles seeding complete!")


if __name__ == "__main__":
    try:
        # Dono functions ko yahan call karein
        seed_products()
        seed_vehicles()
    finally:
        db.close()