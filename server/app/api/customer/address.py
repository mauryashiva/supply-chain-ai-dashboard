from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Modular Imports
from ...database import get_db
from ...models.customer import address as address_models
from ...models.shared import User
from ...schemas.customer import address as address_schemas
from ..auth import get_current_user

router = APIRouter()

# ---------------- ADD ADDRESS ----------------
@router.post("/", response_model=address_schemas.Address, status_code=status.HTTP_201_CREATED)
def add_address(
    address_in: address_schemas.AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new shipping address for the customer. 
    If set as default, resets other addresses for this user.
    """
    # Logic to handle default address toggling
    if address_in.is_default:
        db.query(address_models.Address).filter(
            address_models.Address.user_id == current_user.id
        ).update({"is_default": False})

    new_address = address_models.Address(
        **address_in.model_dump(),
        user_id=current_user.id
    )

    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address


# ---------------- GET MY ADDRESSES ----------------
@router.get("/", response_model=List[address_schemas.Address])
def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all saved addresses for the authenticated user.
    """
    return db.query(address_models.Address).filter(
        address_models.Address.user_id == current_user.id
    ).all()


# ---------------- UPDATE ADDRESS ----------------
@router.put("/{address_id}", response_model=address_schemas.Address)
def update_address(
    address_id: int,
    address_in: address_schemas.AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an existing address. Validates ownership before applying changes.
    """
    db_address = db.query(address_models.Address).filter(
        address_models.Address.id == address_id,
        address_models.Address.user_id == current_user.id
    ).first()

    if not db_address:
        raise HTTPException(status_code=404, detail="Address record not found")

    # If this address is being set to default, unset others
    if address_in.is_default:
        db.query(address_models.Address).filter(
            address_models.Address.user_id == current_user.id
        ).update({"is_default": False})

    # Update fields dynamically
    update_data = address_in.model_dump()
    for key, value in update_data.items():
        setattr(db_address, key, value)

    db.commit()
    db.refresh(db_address)
    return db_address


# ---------------- DELETE ADDRESS ----------------
@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a specific address from the user profile.
    """
    db_address = db.query(address_models.Address).filter(
        address_models.Address.id == address_id,
        address_models.Address.user_id == current_user.id
    ).first()

    if not db_address:
        raise HTTPException(status_code=404, detail="Address record not found")

    db.delete(db_address)
    db.commit()
    return None