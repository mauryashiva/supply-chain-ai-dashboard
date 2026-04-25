import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from ...database import Base

class MediaType(str, enum.Enum):
    image = "image"
    video = "video"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    stock_quantity = Column(Integer)
    description = Column(Text, nullable=True)
    category = Column(String, index=True, nullable=True)
    supplier = Column(String, nullable=True)
    reorder_level = Column(Integer, default=10, nullable=True)
    cost_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    gst_rate = Column(Float, nullable=True, default=0.0)
    last_restocked = Column(DateTime, nullable=True)

    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = 'product_images'

    id = Column(Integer, primary_key=True, index=True)
    media_url = Column(String, nullable=False)
    media_type = Column(Enum(MediaType), default=MediaType.image)
    product_id = Column(Integer, ForeignKey('products.id'))
    product = relationship("Product", back_populates="images")