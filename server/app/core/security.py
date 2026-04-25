import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import jwt
from passlib.context import CryptContext

# Load environment variables from .env
load_dotenv()

# ==============================
# ENV CONFIG
# ==============================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080)  # Default = 7 days
)

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in environment variables")


# ==============================
# PASSWORD HASHING (BCRYPT)
# ==============================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# RENAMED TO MATCH AUTH.PY EXPECTATIONS
def get_password_hash(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ==============================
# JWT TOKEN CREATION
# ==============================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.
    'data' should contain the 'sub' (user ID).
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access_token"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt