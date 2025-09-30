"""
Donation model and schema definitions
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class DonationStatus(str, Enum):
    DIAJUKAN = "Diajukan"
    SIAP_DIJEMPUT = "Siap Dijemput"
    DITERIMA = "Diterima"

class DonationBase(BaseModel):
    donor_user_id: int  # Foreign key to accounts.user_id (who donates)
    type_of_food: List[str]  # List of food types
    latitude: float
    longitude: float
    status: DonationStatus = DonationStatus.DIAJUKAN

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseModel):
    type_of_food: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[DonationStatus] = None
    receiver_user_id: Optional[int] = None  # Who receives the donation

class DonationResponse(DonationBase):
    donation_id: int
    receiver_user_id: Optional[int] = None  # Foreign key to accounts.user_id (who receives)
    created_at: datetime
    expires_at: datetime  # 1 hour after created_at
    
    class Config:
        from_attributes = True

class DonationInDB(DonationResponse):
    pass