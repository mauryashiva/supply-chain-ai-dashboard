from pydantic import BaseModel, ConfigDict

class VehicleBase(BaseModel):
    vehicle_number: str
    driver_name: str
    latitude: float
    longitude: float
    status: str
    live_temp: float
    orders_count: int
    fuel_level: float

class Vehicle(VehicleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)