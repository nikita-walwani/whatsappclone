import time
from fastapi import FastAPI, Form, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from schemas  import UserCreate, UserLogin, Token, TokenWithUsers, EditUser
from database import user_collection, media_collection
from auth import decode_access_token, hash_password, verify_password, create_access_token
from bson.objectid import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from collections import defaultdict
from fastapi.staticfiles import StaticFiles
import os, shutil

app = FastAPI()


# Allow requests from React (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('REACT_APP_URL')],  # Your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Determine the base directory of the current script
base_dir = os.path.dirname(os.path.realpath(__file__))

# Construct the path to the 'static' directory
static_dir = os.path.join(base_dir, "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static")

os.makedirs("static/media", exist_ok=True)

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
async def edit_user(user_data: EditUser,userId: str, token: str = Depends(oauth2)):
    # Decode token and verify payload
    payload = decode_access_token(token)
    print(payload)
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
        "profile": user_data.file_url,
        "profile_status": user_data.profile_status
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
            "profile_status": updated_user["profile_status"],
            "file_url": updated_user["file_url"]
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


@app.post("/upload-media")
async def upload_media( user_id: str = Form(...),
    file: UploadFile = File(...),
    media_type: str = Form("profile_image"),
    token: str = Depends(oauth2)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token.")
    
    filename = f"{user_id}_{file.filename}"
    path = f"static/media/{filename}"
    
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url = f"{os.getenv('VITE_BACKEND_BASE_URL')}/{path}" 
   
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


# websocket

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
                if message_type == "text":   
                    file_message = {
                        "userId": sender_id,
                        "type": "text",
                        "text": message.get("text"),
                        "timestamp": int(time.time() * 1000)
                    }

                elif message_type == "file":
                    file_message={
                        "userId": sender_id,
                        "type": "file",
                        "file": message.get("bytes"),
                        "mime": message.get("mime"),
                        "filename": message.get("filename"),
                        "timestamp": int(time.time() * 1000)
                    }
                
                if receiver_id in user_connections and receiver_id != sender_id:
                            await user_connections[receiver_id].send_json(file_message)

                if sender_id in user_connections:
                        await user_connections[sender_id].send_json(file_message)


    except WebSocketDisconnect:
        user_connections.pop(sender_id, None)
        print(f"WebSocket disconnected: {e.code}")
    except RuntimeError as e:
        print(f"Runtime error: {e}")
    except Exception as e:
        print(f"Unhandled error: {e}")