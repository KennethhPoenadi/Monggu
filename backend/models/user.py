"""
User model and schema definitions
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema"""
    name: str
    email: EmailStr

class UserCreate(UserBase):
    """Schema for creating a new user"""
    pass

class UserUpdate(BaseModel):
    """Schema for updating user"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    """User model as stored in database"""
    pass
