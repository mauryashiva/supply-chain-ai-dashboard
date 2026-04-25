from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ...database import Base

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    flat = Column(String, nullable=False)
    area = Column(String, nullable=False)
    landmark = Column(String, nullable=True)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    country = Column(String, default="India")
    is_default = Column(Boolean, default=False)

    user = relationship("shared.User", back_populates="addresses")