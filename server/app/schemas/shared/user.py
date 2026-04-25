from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.user

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)