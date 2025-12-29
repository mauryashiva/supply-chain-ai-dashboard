from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
# Import database session, schemas, models, and security utilities
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .. import security

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches a list of all users with pagination.
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new user in the database.
    """
    # Check if a user with this email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password before saving
    hashed_password = security.get_password_hash(user.password)
    # Exclude the plain-text password from the data to be saved
    user_data = user.model_dump(exclude={"password"})
    
    # Create a new User model instance
    db_user = models.User(**user_data, hashed_password=hashed_password)
    
    # Add, commit, and refresh to get the new user object from the DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing user's details by their ID.
    """
    # Find the user in the database
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    # If user not found, raise a 404 error
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Get the update data, excluding fields that weren't set
    update_data = user_update.model_dump(exclude_unset=True)
    # Loop through the provided data and update the user object
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    # Commit the changes to the database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Deletes a user from the database by their ID.
    """
    # Find the user in the database
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    # If user not found, raise a 404 error
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Delete the user and commit the change
    db.delete(db_user)
    db.commit()
    # Return None with a 204 status code (No Content)
    return None