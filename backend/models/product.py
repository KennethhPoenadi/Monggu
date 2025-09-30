"""
Product model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ProductBase(BaseModel):
	product_name: str
	expiry_date: date
	count: int
	type_product: str

class ProductCreate(ProductBase):
	pass

class ProductUpdate(BaseModel):
	product_name: Optional[str] = None
	expiry_date: Optional[date] = None
	count: Optional[int] = None
	type_product: Optional[str] = None

class ProductResponse(ProductBase):
	product_id: int
	created_at: datetime
    
	class Config:
		from_attributes = True

class ProductInDB(ProductResponse):
	pass
