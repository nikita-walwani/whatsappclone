from pydantic import BaseModel, EmailStr
from typing import List, Optional


class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str

class UserLogin(BaseModel):
    email:EmailStr
    password:str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    

# User model
class User(BaseModel):
    id: str
    username: str
    email:EmailStr

# Combined model with both token and users
class TokenWithUsers(BaseModel):
    token: Token
    users: List[User]
    
class EditUser(BaseModel):
    name:str
    profile: Optional[str] = None
    profile_status: Optional[str] = None
    