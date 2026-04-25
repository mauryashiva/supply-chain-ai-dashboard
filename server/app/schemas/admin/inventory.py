from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    image = "image"
    video = "video"

class StockStatus(str, Enum):
    In_Stock = "In Stock"
    Low_Stock = "Low Stock"
    Out_of_Stock = "Out of Stock"

class ProductImageBase(BaseModel):
    media_url: str
    media_type: MediaType = MediaType.image

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    sku: str
    stock_quantity: int
    description: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    reorder_level: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = 0.0
    last_restocked: Optional[datetime] = None

class ProductCreate(ProductBase):
    images: List[ProductImageCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    reorder_level: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = None
    last_restocked: Optional[datetime] = None
    images: Optional[List[ProductImageCreate]] = None

class Product(ProductBase):
    id: int
    images: List[ProductImageResponse] = []
    status: StockStatus
    model_config = ConfigDict(from_attributes=True)