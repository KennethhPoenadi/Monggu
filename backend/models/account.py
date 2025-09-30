"""
Account model and schema definitions
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    email: EmailStr
    name: str

class AccountCreate(BaseModel):
    email: EmailStr
    name: str

class AccountUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class AccountResponse(AccountBase):
    user_id: int  # Auto-increment primary key
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountInDB(AccountResponse):
    pass
