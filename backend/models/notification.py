"""
Notification model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    PRODUCT_EXPIRY = "Product Expiry"
    DONATION_RECEIVED = "Donation Received"
    DONATION_EXPIRED = "Donation Expired"
    REWARD_EARNED = "Reward Earned"

class NotificationBase(BaseModel):
    user_id: int  # Foreign key to accounts.user_id
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    notification_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationInDB(NotificationResponse):
    pass