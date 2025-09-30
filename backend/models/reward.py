"""
Reward model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class RewardType(str, Enum):
    VOUCHER = "Voucher"
    DISCOUNT = "Discount"
    FREE_ITEM = "Free Item"
    BADGE = "Badge"

class RewardBase(BaseModel):
    name: str
    description: str
    points_required: int
    reward_type: RewardType
    value: str  # e.g., "10000 rupiah", "20% discount", "Free coffee"
    is_active: bool = True

class RewardCreate(RewardBase):
    pass

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_required: Optional[int] = None
    reward_type: Optional[RewardType] = None
    value: Optional[str] = None
    is_active: Optional[bool] = None

class RewardResponse(RewardBase):
    reward_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Reward Claims (junction table)
class UserRewardBase(BaseModel):
    user_id: int  # Foreign key to accounts.user_id
    reward_id: int  # Foreign key to rewards.reward_id

class UserRewardCreate(UserRewardBase):
    pass

class UserRewardResponse(UserRewardBase):
    user_reward_id: int
    claimed_at: datetime
    is_used: bool = False
    used_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RewardInDB(RewardResponse):
    pass

class UserRewardInDB(UserRewardResponse):
    pass