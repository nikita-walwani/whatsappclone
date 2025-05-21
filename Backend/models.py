from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime

class User(BaseModel):
    email:EmailStr
    name:str
    password:str
    file_url: Optional[str] = None
    profile_status: Optional[str] = None
    

class UserInDB(User):
    hashed_password: str
    
class Message(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    message: Optional[str] = None
    status: str
    timestamp: datetime
    file_path: Optional[str] = None
    message_type:str
 
class MessageStatusUpdate(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    status: str