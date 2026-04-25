import enum
from sqlalchemy import Column, Integer, String, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from ..database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole, name="userrole"), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)

    # Cross-domain relationships
    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user", cascade="all, delete")