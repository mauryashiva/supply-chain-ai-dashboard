import json
import os
import urllib.request
from urllib.error import HTTPError
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

# Modular Imports
from ..database import get_db
from ..models import shared as shared_models
from ..schemas.shared import user as user_schemas
from ..core import security
from ..core.security import SECRET_KEY, ALGORITHM

router = APIRouter()

def _validate_supabase_token(token: str):
    """Validate a Supabase access token via Supabase /auth/v1/user endpoint."""
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        return None

    url = f"{supabase_url}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": service_key,
        "Content-Type": "application/json",
    }

    try:
        request = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(request, timeout=5) as response:
            data = json.loads(response.read().decode())
            if isinstance(data, dict) and data.get("id"):
                return data
            if isinstance(data, dict) and "data" in data and data["data"].get("id"):
                return data["data"]
    except (HTTPError, Exception):
        return None

    return None


# =========================
# SIGNUP
# =========================
@router.post("/signup", response_model=user_schemas.User)
def signup(user_in: user_schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user (default role: user).
    """
    existing_user = db.query(shared_models.User).filter(
        shared_models.User.email == user_in.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )

    new_user = shared_models.User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        role=shared_models.UserRole.user
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================
# LOGIN
# =========================
@router.post("/login")
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login.
    """
    user = db.query(shared_models.User).filter(
        shared_models.User.email == form_data.username
    ).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create local JWT token
    access_token = security.create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }


# =========================
# AUTH DEPENDENCY
# =========================

# Updated to match the prefixing logic used in main.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Global dependency to extract user from local JWT or Supabase fallback.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1) Attempt Local JWT Decode
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            user = db.query(shared_models.User).filter(shared_models.User.id == int(user_id)).first()
            if user:
                return user
    except (JWTError, ValueError):
        pass

    # 2) Attempt Supabase Token Validation (Fallback)
    supabase_user = _validate_supabase_token(token)
    if supabase_user:
        email = supabase_user.get("email")
        if not email:
            raise credentials_exception

        user = db.query(shared_models.User).filter(shared_models.User.email == email).first()
        
        # Auto-provision local record if Supabase authenticated but local record is missing
        if user is None:
            random_pwd = os.urandom(24).hex()
            user = shared_models.User(
                email=email,
                hashed_password=security.get_password_hash(random_pwd),
                role=shared_models.UserRole.user,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    raise credentials_exception