from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

Mongo_details = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(Mongo_details)
db = client.chatapp_db
user_collection=db.get_collection("users") 
media_collection=db.get_collection("media_collection") 