from sqlalchemy import Column, Integer, String, Float
from ...database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True)
    driver_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="Idle")
    live_temp = Column(Float)
    orders_count = Column(Integer)
    fuel_level = Column(Float)

