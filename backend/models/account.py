"""
Account model and schema definitions
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    user_id: int  # Foreign key to user.user_id
    email: EmailStr
    name: str

class AccountCreate(BaseModel):
    user_id: int
    email: EmailStr

class AccountUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class AccountResponse(AccountBase):
    account_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountInDB(AccountResponse):
    pass
