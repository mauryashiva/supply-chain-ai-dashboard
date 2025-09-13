from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

@router.get("/products", response_model=List[schemas.Product])
def get_all_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Product ke saath uske images ko bhi pehle se load kar lein
    products = db.query(models.Product).options(joinedload(models.Product.images)).order_by(models.Product.name).offset(skip).limit(limit).all()
    return products

@router.post("/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product_check = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    # --- NEW LOGIC: Images ko product details se alag karein ---
    product_data = product.model_dump(exclude={"images"})
    db_product = models.Product(**product_data)
    
    # Har image/video ke liye ProductImage entry banayein aur use product se jodein
    if product.images:
        for img_data in product.images:
            new_image = models.ProductImage(**img_data.model_dump())
            db_product.images.append(new_image)
            
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    print(f"✅ New product created via API: {db_product.name} (SKU: {db_product.sku})")
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    # Product ke saath uske images ko bhi pehle se load kar lein
    db_product = db.query(models.Product).options(joinedload(models.Product.images)).filter(models.Product.id == product_id).first()
    
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    update_data = product_update.model_dump(exclude_unset=True)
    
    # --- NEW LOGIC: Images ko alag se handle karein ---
    if 'images' in update_data:
        # Purani saari images/videos ko hata dein
        db_product.images.clear() 
        # Nayi list se nayi images/videos add karein
        # Note: Pydantic v2 mein, yeh list of dicts hota hai
        for img_data_dict in update_data['images']:
            new_image = models.ProductImage(**img_data_dict)
            db_product.images.append(new_image)
        # update_data se 'images' ko hata dein taaki neeche loop mein error na aaye
        del update_data['images']

    # Baaki ke simple fields ko update karein
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- YAHAN BADLAAV KIYA GAYA HAI ---
@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    db.delete(db_product)
    db.commit()
    return None