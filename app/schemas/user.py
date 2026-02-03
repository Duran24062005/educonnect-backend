from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional

class RegisterUser(BaseModel):
    first_name: str = Field(...)
    last_name: str = Field(...)
    birthdate: date
    document_number: str
    email: EmailStr
    password: str
    invitation_code: Optional[str] = None
    requested_role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    birthdate: date
    document_number: str
    role: Optional[str]
    is_active: bool
    created_at: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
