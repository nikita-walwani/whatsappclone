from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    email:EmailStr
    name:str
    password:str
    file_url: Optional[str] = None
    profile_status: Optional[str] = None
    

class UserInDB(User):
    hashed_password: str
 