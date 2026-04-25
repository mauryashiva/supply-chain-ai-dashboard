from pydantic import BaseModel, ConfigDict
from typing import Optional

class AddressBase(BaseModel):
    full_name: str
    phone_number: str
    flat: str
    area: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: Optional[str] = "India"
    is_default: Optional[bool] = False

class AddressCreate(AddressBase):
    pass

class Address(AddressBase):
    id: int
    model_config = ConfigDict(from_attributes=True)