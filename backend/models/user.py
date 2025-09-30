"""
User model and schema definitions
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    user_id: int  # Foreign key to accounts.user_id
    poin: int = 0
    rank: str = "beginner"


class UserCreate(BaseModel):
    user_id: int
    poin: int = 0
    rank: str = "beginner"


class UserUpdate(BaseModel):
    poin: Optional[int] = None
    rank: Optional[str] = None


class UserResponse(UserBase):
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    pass
