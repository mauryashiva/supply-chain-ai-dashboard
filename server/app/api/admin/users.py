from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Updated relative imports to jump two levels to reach app root
from ...database import get_db
from ...schemas.shared import user as user_schemas
from ...models import shared as shared_models
from ...core import security
from ..auth import get_current_user

# Router remains protected by admin authentication
router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[user_schemas.User])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches a list of all users with pagination.
    """
    # Using shared_models where the base User table resides
    users = db.query(shared_models.User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user_in: user_schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user into the system.
    """
    # Uniqueness check
    db_user = db.query(shared_models.User).filter(shared_models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Secure password hashing
    hashed_password = security.get_password_hash(user_in.password)
    user_data = user_in.model_dump(exclude={"password"})
    
    new_user = shared_models.User(**user_data, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=user_schemas.User)
def update_user(user_id: int, user_update: user_schemas.UserUpdate, db: Session = Depends(get_db)):
    """
    Updates specific user metadata.
    """
    db_user = db.query(shared_models.User).filter(shared_models.User.id == user_id).first()
    
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Removes a user record.
    """
    db_user = db.query(shared_models.User).filter(shared_models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    return None