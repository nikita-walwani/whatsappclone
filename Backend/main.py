from pathlib import Path
import time
import aiosqlite
from fastapi import FastAPI, Form, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from common_processing import create_message_data
from sqlite_database.sqlite_models import ChatMessage
from schemas  import UserCreate, UserLogin, Token, TokenWithUsers, EditUser
from database import user_collection, media_collection
from auth import decode_access_token, hash_password, verify_password, create_access_token
from bson.objectid import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from collections import defaultdict
from models import Message, MessageStatusUpdate
from sqlite_database.sqlite_config import SessionLocal, engine, Base
from sqlite_database.sqlite_db_activities import save_message_to_db, update_message_statuses  
from fastapi.staticfiles import StaticFiles
import os, shutil
from contextlib import asynccontextmanager
import base64
from typing import List, Optional
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    
app = FastAPI(lifespan=lifespan)

prod_frontend = os.getenv("REACT_APP_URL")
#local_frontend = "http://localhost:5173"

app.add_middleware(
    CORSMiddleware,
    #allow_origins=[local_frontend],
    allow_origins=[prod_frontend],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Choose the static folder based on the environment
if os.getenv("ENV")=='production':
    static_folder_name = "prod_static"
else:
    static_folder_name = "local_static"

base_dir = os.path.dirname(os.path.realpath(__file__))
static_dir = os.path.join(base_dir, static_folder_name)


app.mount("/static", StaticFiles(directory=static_dir), name="static")

oauth2 = OAuth2PasswordBearer(tokenUrl="login")



@app.post("/register", response_model=Token)
async def register(user:UserCreate):
    if await user_collection.find_one({"email":user.email}):
        raise HTTPException(status_code=400, detail="User Already Exist") 
    
    hashed_pass = hash_password(user.password)
    user_info = {"email":user.email, "name":user.name,"hashed_password":hashed_pass}
    await user_collection.insert_one(user_info)
    
    token  = create_access_token({"sub":user.email})
    return {"access_token":token, "token_type":"bearer"}



@app.post("/login")
async def login(user_credentials: UserLogin):
        
        user = await user_collection.find_one({"email": user_credentials.email})
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid credentials")
    
        if not verify_password(user_credentials.password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        # profile = media_collection.find_one({'user_id':})
        
        token = create_access_token({"sub": user["email"]})
        
        return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["name"],
            "email": user["email"],
            "profile":user.get('profile', "")
        }
    }
        


@app.post("/edit-user/{userId}")
async def edit_user(user_data: EditUser, userId: str, token: str = Depends(oauth2)):
    # Decode token and verify payload
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Token")
    
    # Convert userId (string) to ObjectId (MongoDB requirement)
    try:
        user_id = ObjectId(userId)  # Convert to ObjectId for MongoDB query
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Find user by _id (userId converted to ObjectId)
    user = await user_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare data for updating the user
    update_user = {
        "name": user_data.name,
        "profile": user_data.profile
    }
    
    # Perform the update operation
    result = await user_collection.update_one(
        {"_id": user_id},
        {"$set": update_user}
    )
    
    # Check if the update was successful
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to the user")
    
    # Fetch the updated user data
    updated_user = await user_collection.find_one({"_id": user_id})

    # Generate a new token for the updated user
    new_token = create_access_token({"sub": updated_user["email"]})
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user": {
            "id": str(updated_user["_id"]),
            "username": updated_user["name"],
            "email": updated_user["email"],
            "profile": updated_user.get('profile')
        }
    }



@app.get("/get-users", response_model=TokenWithUsers)
async def get_user(token: str = Depends(oauth2)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Token")

    try:
        user_cursor = user_collection.find({})
        users = []
        async for user in user_cursor:  # Ensure Motor async driver is used
            users.append({
                "id": str(user["_id"]),
                "username": user.get("name", "Unnamed User"),
                "email": user.get("email"),
                "profile":user.get('profile', "")
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error")

    new_token = Token(access_token=token, token_type="bearer")

    return {"token": new_token, "users": users}
 

@app.get("/protected")
async def protected_route(token: str = Depends(oauth2)):
    from auth import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"message": f"Hello {payload['sub']}! This is a protected route."}

@app.post("/logout")
async def logout(token: str = Depends(oauth2)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token.")

    return JSONResponse(content={"message": "Logged out successfully."})

@app.put("/messages/update-status")
async def update_message_status(messages: List[MessageStatusUpdate],  token: str = Depends(oauth2)):
    # Decode and validate token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async with SessionLocal() as session:
        for msg in messages:
            # Find the message by id, sender_id, and receiver_id
            result = await session.execute(
                select(ChatMessage).where(
                    ChatMessage.id == msg.id,
                    ChatMessage.sender_id == msg.sender_id,
                    ChatMessage.receiver_id == msg.receiver_id
                )
            )
            chat_message = result.scalar_one_or_none()
            
            if chat_message:
                chat_message.status = msg.status
            else:
                # Optional: raise an error or skip if message not found
                continue

        await session.commit()
    return {"status":200,"message": "Statuses updated successfully"}

@app.post("/upload-media")
async def upload_media( user_id: str = Form(...),
    file: UploadFile = File(...),
    media_type: str = Form("profile_image"),
    token: str = Depends(oauth2)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token.")
    filename = f"{user_id}_{file.filename}"

    # Full absolute path on disk
    path = os.path.join(static_dir, "media", filename)

    # Make sure directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)

    # Save the file
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Build the URL that frontend can use
    backend_base_url = os.getenv("VITE_BACKEND_BASE_URL").rstrip("/")

    # URL must use /static/, not the folder name
    url = f"{backend_base_url}/static/media/{filename}"
    
   
    media_doc = {
        "user_id": user_id,
        "type": media_type,
        "filename": filename,
        "url": url,
        "uploaded_at": int(time.time() * 1000)
    }
    
    is_media_exists = await media_collection.find_one({'user_id':user_id})
    
    if is_media_exists:
        
        result= await user_collection.update_one(
        {'_id': is_media_exists['_id']},
        {"$set": media_doc}
    )
        media_id = is_media_exists['_id']
    else:
       result = await media_collection.insert_one(media_doc)
       media_id = result.inserted_id
    
    
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
            raise HTTPException(status_code=400, detail="Couldn't Find User")
    
    await user_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'profile': url}}
)
    
    return {"message": "Media uploaded", "url": url, "media_id": str(media_id)}


@app.get("/messages/{userId}", response_model=dict)
async def get_messages(userId: str, token: str = Depends(oauth2)):
    # Decode and validate token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Validate ObjectId
    try:
        user_id = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Check if user exists in MongoDB
    user = await user_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Path to your SQLite DB
    BASE_DIR = Path(__file__).resolve().parent
    db_path = BASE_DIR / "sqlite_database" / "data" / "chat_history.db"

    messages: List[Message] = []
    

    query = """
        SELECT 
            cm.id, cm.sender_id, cm.receiver_id, cm.message, cm.status, cm.timestamp, cm.media_id,
            m.file_path, cm.message_type
        FROM chat_messages cm
        LEFT JOIN media m ON cm.media_id = m.id
         WHERE cm.sender_id = ? OR cm.receiver_id = ?
        ORDER BY cm.timestamp DESC
        LIMIT 50
    """

    async with aiosqlite.connect(db_path) as db:
        async with db.execute(query, (userId, userId,)) as cursor:
            async for row in cursor:
                raw_file_path = row[7]  # media.file_path
                file_url = raw_file_path if raw_file_path else None  # m.file_path


                messages.append(Message(
                    id=row[0],
                    sender_id=row[1],
                    receiver_id=row[2],
                    message=row[3],
                    status=row[4],
                    timestamp=row[5],
                    file_path=file_url,
                    message_type=row[8]
                ))

    return {"user_id": userId, "messages": [msg.dict() for msg in messages]}

 
user_connections = {}

@app.websocket("/ws/chat/{sender_id}/{receiver_id}")
async def websocket_endpoint(websocket: WebSocket, sender_id: str, receiver_id: str):
    await websocket.accept()
    user_connections[sender_id] = websocket
  
    try:
        while True:
            data = await websocket.receive()
            if "text" in data:
                try:
                    import json
                    message = json.loads(data["text"])
                except json.JSONDecodeError:
                    continue  # skip malformed messages
                
                message_type = message.get("type")
                timestamp_ms = int(time.time() * 1000)

                message_data = {
                    "userId": sender_id,
                    "receiver_id": receiver_id,
                    "type": message_type,
                    "timestamp": timestamp_ms
                }

                if message_type == "text":
                    message_data["text"] = message.get("text")

                elif message_type == "file":
                    file_bytes = bytes(message.get("bytes", []))
                    message_data["file"] = base64.b64encode(file_bytes).decode("utf-8")  
                    message_data["mime"] = message.get("mime")
                    message_data["filename"] = message.get("filename")
                    
                if receiver_id in user_connections and sender_id in user_connections:
                    message_data["status"] = 'read'
                else:
                    message_data["status"] = 'sent'

                await save_message_to_db(message_data)
                               
                if receiver_id in user_connections and receiver_id != sender_id:
                            await user_connections[receiver_id].send_json(message_data)

                if sender_id in user_connections:
                        await user_connections[sender_id].send_json(message_data)


    except WebSocketDisconnect:
        user_connections.pop(sender_id, None)
        print(f"WebSocket disconnected: {e.code}")
    except RuntimeError as e:
        print(f"Runtime error: {e}")
    except Exception as e:
        print(f"Unhandled error: {e}")
        

connected_users_list={}
chat_users_list = []

def is_user_connected(chat_users_list, user_id, connected_to):
    return any(user for user in chat_users_list if user["id"] == user_id and user["connectedTo"] == connected_to)

def update_user_connection(chat_users_list, user_id, new_connected_to):
    for user in chat_users_list:
        if user.get("id") == user_id:
            user["connectedTo"] = new_connected_to
            return True  # Update successful
    
    # User not found, so add new
    chat_users_list.append({
        "id": user_id,
        "connectedTo": new_connected_to
    })
    return False  # New user added

@app.websocket("/ws/connect-user")
async def track_user_actions(websocket:WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            
            parsed_data = json.loads(data)  
            user_id = parsed_data["user_id"]
            
            if parsed_data["action"] == 'login':
                connected_users_list[user_id]=websocket
                await connected_users_list[user_id].send_json({"data":"User Logged in Successfully"})
                if parsed_data["update_status"] != []:
                        await update_message_statuses(parsed_data["update_status"], "delivered")
                        user_list = parsed_data["user_list_ids"]
                        if user_list != []:
                            for receiver_id in user_list:
                                if receiver_id in connected_users_list:
                                    update_status = {"update_status":parsed_data["update_status"]}
                                    await connected_users_list[receiver_id].send_json(update_status)
                
            if parsed_data["action"] == 'chatopened':
                receiver_id = parsed_data["receiver_id"] 
                
                if  parsed_data["is_chat_active"] == True:   
    
                    message_data = create_message_data(user_id, receiver_id, parsed_data)
                    if receiver_id in connected_users_list:
                        if is_user_connected(chat_users_list, receiver_id, user_id):                       
                            message_data["status"] = "read"
                        else:
                            message_data["status"] = "delivered"
                        await connected_users_list[receiver_id].send_json(message_data)
                        
                    chat_id = await save_message_to_db(message_data) 
                    message_data["chat_id"]= chat_id    
                    await connected_users_list[user_id].send_json(message_data)
                    
                if  parsed_data["is_chat_active"] == False:
                    receiver_id = parsed_data["receiver_id"]
                    update_user_connection(chat_users_list, user_id, receiver_id)
                    if parsed_data["update_status"] != []: 
                        await update_message_statuses(parsed_data["update_status"], "read")
                        
                        if receiver_id in connected_users_list:
                            update_status = {"update_status":parsed_data["update_status"]}
                            await connected_users_list[receiver_id].send_json(update_status)
                        if receiver_id in chat_users_list:
                            chat_users_list[user_id]=websocket 
   
    except WebSocketDisconnect:
        print(f"WebSocket disconnected")
    except RuntimeError as e:
        print(f"Runtime error: {e}")
    except Exception as e:
        print(f"Unhandled error: {e}")
    
    
    
