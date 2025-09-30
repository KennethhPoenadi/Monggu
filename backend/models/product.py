"""
Product model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ProductBase(BaseModel):
    user_id: int  # Foreign key to accounts.user_id (owner)
    product_name: str
    expiry_date: date
    count: int
    type_product: str  # e.g., "Vegetable", "Fruit", "Meat", "Dairy"
    image_url: Optional[str] = None  # For future photo upload feature

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    expiry_date: Optional[date] = None
    count: Optional[int] = None
    type_product: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    product_id: int
    created_at: datetime
    days_until_expiry: Optional[int] = None  # Calculated field
    
    class Config:
        from_attributes = True

class ProductInDB(ProductResponse):
    pass
