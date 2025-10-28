from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .. import security

# --- CHANGE 1: Naya "Security Guard" import karein ---
from ..auth_deps import get_current_user_claims

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # --- CHANGE 2: Endpoint ko secure karein ---
    user_claims: dict = Depends(get_current_user_claims)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    # --- CHANGE 2: Endpoint ko secure karein ---
    user_claims: dict = Depends(get_current_user_claims)
):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = security.get_password_hash(user.password)
    user_data = user.model_dump(exclude={"password"})
    db_user = models.User(**user_data, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int, 
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    # --- CHANGE 2: Endpoint ko secure karein ---
    user_claims: dict = Depends(get_current_user_claims)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    # --- CHANGE 2: Endpoint ko secure karein ---
    user_claims: dict = Depends(get_current_user_claims)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    return None