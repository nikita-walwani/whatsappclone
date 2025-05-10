from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import  CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

#passwrod hashing
pwd_context= CryptContext(schemes=["bcrypt"], deprecated="auto")

secret_key = os.getenv("SECRET_KEY")
algorithm = "HS256"
access_token_expiry_minute = 30


def hash_password(password:str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_passwrod):
    return pwd_context.verify(plain_password, hashed_passwrod)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)



def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError:
        return None
    
    
