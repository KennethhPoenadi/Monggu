"""
Delivery model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeliveryBase(BaseModel):
	user_id1: int  # sender (FK to users)
	user_id2: int  # receiver (FK to users)
	product_id: int  # FK to products
	status: str

class DeliveryCreate(DeliveryBase):
	pass

class DeliveryUpdate(BaseModel):
	status: Optional[str] = None

class DeliveryResponse(DeliveryBase):
	delivery_id: int
	created_at: datetime
    
	class Config:
		from_attributes = True

class DeliveryInDB(DeliveryResponse):
	pass
