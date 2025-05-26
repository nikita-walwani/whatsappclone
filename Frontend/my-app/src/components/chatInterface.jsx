import { use, useEffect, useRef } from "react";
import React, { useState } from "react";
import "../css/chatRoom.scss";
import profile from "../images/profile.png"
import doodles from "../images/message-doodles.png"
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "./confirmDialog";
import defaulScreenBg from "../images/default-screen-bg.png"
import SpeechToText from "./speechToText";
import SendMedia from "./sendMedia";
import { getMediaCategoryFromMime } from './findMediaByMime'
import UploadImage from "./uploadEditImage"
import { breakpoints } from "../breakpoints";
import SidebarMenu from "./menuForMobile";
import { useMediaQuery } from 'react-responsive';
import { fetchMessages, updateMessageStatus } from '../apis/chat_message';
import {processUsersWithMessages} from '../common_processing/common_processing';
import { BsCheck, BsCheckAll } from 'react-icons/bs';
import {updateUserWithLastMessage} from "../common_processing/common_processing"
import { updateMessageInChatHistory } from "../common_processing/common_processing";
import { FaFileImage, FaFileAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <BsCheck size={20} />;
    case 'delivered':
      return <BsCheckAll size={20} />;
    case 'read':
      return <BsCheckAll size={20} color="var(--accent-color)" />;
    default:
      return null;
  }
};



export default function Chat(){
   
    const currentUserRef = JSON.parse(localStorage.getItem("current_user"));
    const [isDialogOpen, setIsDialogueBox] = useState(false)
    const [isDefaultScreen, setDefaultScreen] = useState(true)
    const [showSendMedia, setShowSendMedia] = useState(false)
    const [IseditUserName, setEditUserName] = useState(false)
    const [userNameOnEdit,  setUserNameOnEdit] = useState('')
    const [showUserList, setShowUsersList] =useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false);
    const isMobile = useMediaQuery({ query: `(max-width: ${breakpoints.md}px)` });
    const [showMenuItemsMobile, setMenuItemsForMobile] = useState(false)
    const [isMainScreen, setMainScreen] = useState(false)
    const [isUserListConatiner, setUserListContainer] = useState(true)
    const [chatHistory, setChatHistory]=useState([])
    const [showProfile, setShowUserProfile] = useState(false)
    const containerRef = useRef(null);
    let temp_chat_list = chatHistory

    const toggleMenuItemsForMobile=()=>{
         setMenuItemsForMobile(!showMenuItemsMobile)
    }

    const handleUploadMedia =(data)=>{
      let current_user = {
        id: currentUserRef.id,
        username: currentUserRef.username,
        email:currentUserRef.email,
        profile:data.url
      };
      
      // Save it initially
      localStorage.setItem("current_user", JSON.stringify(current_user));
      setIsUploadMedia(false)
    }

    const handleSetEditUser=()=>{
      setEditUserName(true)
      const storedUser = JSON.parse(localStorage.getItem("current_user") || "{}");
      setUserNameOnEdit(storedUser.username)
    }

    const handleCancel = ()=>
    {
      setIsDialogueBox(false)
    }
    
    const handleConfirmDialogue=()=>
    {
      setIsDialogueBox(true)
    }

    
    const showUserListOnClick=()=>{
      setShowUsersList(true)
      setShowUserProfile(false)
    }
    const showSendMediaOnclick=()=>{
      setShowSendMedia(true)
    }
   
    const closeSendMediaOnclick=()=>{
      setShowSendMedia(false)
    }
    
    const navigate = useNavigate();
    

    if (!currentUserRef) {
      window.location.href = "/login";
    }

    const [usersList, getList] = useState([])
    let users_data = usersList
    const [token, setToken] = useState("")
   
    const [selectedUser, setSelectedUser] = useState({});

    const [showSendButton, setSendButton] = useState(false);

    const [inputText, setInputText] = useState('');

    const socket = useRef(null);
    const inputRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false); 
    const [IsUploadProfile, setIsUploadMedia]  = useState(false)


    //Set Speech Recognition 
    const [islistening, setIsListening] = useState(false)

    const toggleSpeechListening=()=>{
      setIsListening(!islistening)
      setSendButton(true)
      if (inputText===""){
        setSendButton(false)
      }
    }

    const handleSpeechResult=(transcribedText)=>{
      setInputText(transcribedText)
      setSendButton(true)
    }
   
    const showUserProfileOnClick=()=>{
      setDefaultScreen(true)
      setIsChatOpen(false)
      setShowUsersList(false)
      setShowUserProfile(true)
    }

    //edit user
    const editUser = async (e) => {
      e.preventDefault();
    
      const currentUser = JSON.parse(localStorage.getItem("current_user") || "{}");
    
      // Check if currentUser is valid and has the required id
      if (!currentUser.id) {
        alert("User is not logged in or no user data found.");
        return;
      }
    
      const userId = currentUser.id;
    
      const editData = {
        name: userNameOnEdit,  // taken from input state
        profile: currentUser.profile || "",
      };
    
      try {
        const response = await fetch(`${API_URL}/edit-user/${userId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData)
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          alert(errorData.detail || "Couldn't update user");
          return;
        }
    
        const data = await response.json();
    
        // Check for the presence of an access token
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("current_user", JSON.stringify(data.user));
          setEditUserName(false); // optionally exit edit mode
        } else {
          alert(data.detail || "Couldn't update user");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
      }
    };
    
   
    const handleInputMessage=(e)=>{
      const value = e.target.value;
      setInputText(value)
      if (value.trim() === '') {
        setSendButton(false)
      } else {
        setSendButton(true)
      }
    }
   
    const logoutUser = () => {
      fetch(`${API_URL}/logout`, {
        method: 'POST', 
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then(() => {
          // Clear token and redirect
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        })
        .catch((error) => console.error('Logout failed:', error));
    };

    // websocket functions
    const convertFileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = reader.result.split(',')[1]; 
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
      });
    };
    const sendChatOpenedAction=(sender_id, receiver_id)=>
    {   
        
        const container = containerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        if (socket.current && socket.current.readyState === WebSocket.OPEN){
        const messages_id = temp_chat_list
            .filter(msg =>
              (msg.sender_id === receiver_id && msg.receiver_id === sender_id)
            )
            .map(msg => msg.id);
        const updateChatHistory = updateMessageInChatHistory(temp_chat_list, messages_id, currentUserRef.id, selectedUser.id)
        setChatHistory(updateChatHistory)
        const updatedUsersList = processUsersWithMessages(users_data, temp_chat_list);
        getList(updatedUsersList)

        socket.current.send(JSON.stringify({
          "action" :"chatopened",
          "is_chat_active":false,
          "user_id":sender_id,
          "receiver_id":receiver_id,
          "update_status": messages_id
         }));

        
      }
      else {
        console.warn("WebSocket not open. Message not sent.");
      }
    }

    const sendChatOpenedActionWithMessage = async (sender_id, receiver_id, message_type, file_data)=>
    {
        
        var socket_message;
        if (socket.current && socket.current.readyState === WebSocket.OPEN){
            
        
         if (message_type=="text"){
              socket_message = {
              "action" :"chatopened",
              "is_chat_active":true,
              "user_id":sender_id,
              "receiver_id":receiver_id,
              "data":{
                "type":message_type
                
              }
            }
          const message = inputRef.current.value.trim();
          if (message === "") {
            setSendButton(false);
            return; // Don't send empty messages
          }
          socket_message["data"]["message"]= message
          
          }
        
         if (message_type =="file"){
           if(file_data){
           const base64File = await convertFileToBase64(file_data.file);         
           socket_message = {
            "action" :"chatopened",
            "is_chat_active":true,
            "user_id":sender_id,
            "receiver_id":receiver_id,
            "data":{
            "type":"file",
            "byte":base64File,
            "mime":file_data.mime,
            "filname": file_data.filename
         }
        }
       }
        }
        console.log(socket_message)
        socket.current.send(JSON.stringify(socket_message));
        
        inputRef.current.value = "";
        }
        else {
        console.warn("WebSocket not open. Message not sent.");
       }
    }

    // end websocket functions 

    useEffect(() => {

      setIsChatOpen(true)
      const controller = new AbortController();
      const token = localStorage.getItem("access_token");
      const current_user = localStorage.getItem("current_user")
      const parsed_user =JSON.parse(localStorage.getItem("current_user"));

      setIsChatOpen(false);

    
      fetch(`${API_URL}/get-users`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login'; 
            return; 
          }
    
          if (!res.ok) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("current_user", JSON.stringify(data.user));
            window.location.href = "/login"; // Redirect to the homepage or another page
            console.log (`HTTP error! Status: ${res.status}`);
          }
    
          return res.json();
        })
        .then(async (data) => {
          if (data) {
            getList(data.users);
            const user_list = data.users
            

            const userId = data.currentUserId || data.users[0]?.id; // adapt accordingly
            if (userId) {
              try {
                // Call your axios fetchMessages function here
                const messages = await fetchMessages(currentUserRef.id, token);
                setChatHistory(messages.messages)
                
                const user_messages = messages.messages

                const updatedUsersList = processUsersWithMessages(user_list, user_messages);
                getList(updatedUsersList)

                users_data = updatedUsersList
                temp_chat_list = messages.messages
                // Do something with messages, e.g. setMessages(messages);

                 //   Start websocket
                if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                  socket.current.close();
                }

                socket.current = new WebSocket(`${API_URL}/ws/connect-user`);
                socket.current.onopen = () => {
                setIsConnected(true);
                // Send message to socket on login
                if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                  const messages_id = temp_chat_list
                        .filter(msg =>
                          (msg.status==="sent" || msg.status==="delivered")
                        )
                        .map(msg => msg.id);
                  const user_id = users_data.filter(user=>user.id!=currentUserRef.id).map(user=>user.id)
                  socket.current.send(JSON.stringify({
                    action: "login",
                    user_id: parsed_user.id,
                    update_status : messages_id,
                    user_list_ids:user_id
                  }));
                }    
                };
                socket.current.onmessage = (event) => {
                    setTimeout(() => {
                      
                    
                    let data = JSON.parse(event.data);
                    if ("message_type" in data) {
                      // Add new message to chat history
                      if(data.message_type === "file"){
                          const base64String = data.file; // The base64 data without "data:image/jpeg;base64,"
                          const mime = data.mime;         // e.g. "image/jpeg"
                          const filename = data.filename;
                          const imgSrc = `${base64String}`;
                          data = { ...data, file_path: imgSrc };
                      }
                      setChatHistory(prev => {
                        const newChatHistory = [...prev, data];
                        temp_chat_list = newChatHistory;  // keep temp_chat_list in sync with React state
                        return newChatHistory;
                      });
                    }
 
                    const messages_id = (data.update_status || []).filter(id => id != null);
                   
                    if (messages_id.length > 0){
                      
                      setChatHistory(prev => {
                        const updatedChatHistory = updateMessageInChatHistory(prev, messages_id, currentUserRef.id, selectedUser.id);
                        temp_chat_list = updatedChatHistory;
                        return updatedChatHistory;
                        
                      });
                    }
                    const updatedUsers = updateUserWithLastMessage(users_data, temp_chat_list);
                    getList(updatedUsers);
                    console.log(chatHistory)
                    }, 1000);
                  };

                socket.current.onclose = () => {
                setIsConnected(false);
                navigate("/login");
                };
                socket.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                };


              //   End websocket 




              } catch (error) {
              }
            }
          }
       })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.info('[Info] Fetch was aborted by AbortController.');
          } else {
            console.error('[Error] Fetch failed:', error.message);
          }
        });

     
    
   
      return () => {
        controller.abort();
      };
    },[]);
    
   
    return(
    
        <div className="chat-screen-main">
            <div className="left-bar">
                 <nav>
                    <div>
                    <button onClick={showUserListOnClick}><i className="fas fa-comment-dots" style={{display:'block'}}></i></button>
                    {/* <button><i className="fas fa-user-plus" style={{display:'block'}}></i></button> */}
                    </div>
                    
                    <div>
                    <button className="user-profile" onClick={showUserProfileOnClick}>
                      <img src={currentUserRef.profile || profile}  className="profile-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = profile; // default avatar
                      }}
                      ></img>
                    </button>
                    <button onClick={handleConfirmDialogue}   
                    ><i className="fas fa-sign-out-alt" style={{display:'block'}}></i></button>
                     <ConfirmDialog
                        isOpen={isDialogOpen}
                        message={`Are you sure, you want to logout?`}
                        onConfirm={logoutUser}
                        onCancel={handleCancel}
                      />
                    </div>
                 </nav>
            </div>
            <div className="mid-chat-screen" style={{
                display: isMobile ? (isUserListConatiner ? 'block' : 'none') : 'block'
              }}>
              <div style={{display:showUserList? "block":"none", padding:'10px'}}>
                <div className="message-header contact-header">
                    <h3>Chats</h3>
                    {isMobile &&(
                           <div onClick={toggleMenuItemsForMobile}>
                    <i className="fas fa-bars" style={{ display: 'block', color:'white' }}></i>
                    <SidebarMenu
                    isopen={showMenuItemsMobile}
                    currentUserRef= {currentUserRef}
                    showLogoutUser={setIsDialogueBox}
                    showProfile={setShowUserProfile} 
                    showChatList={setShowUsersList}
                    showChat={setIsChatOpen}
                    showMainChatScreen={setMainScreen}
                    showUserListDiv={setUserListContainer}
                    setIsOpen={setMenuItemsForMobile}
                    />
                    <ConfirmDialog
                        isOpen={isDialogOpen}
                        message={`Are you sure, you want to logout?`}
                        onConfirm={logoutUser}
                        onCancel={handleCancel}
                    />
                    </div>
                    )}
                   
                </div>
                <div className="show-list">
                    <ul>
                        {usersList
                        .filter(user => user.id !== currentUserRef.id) // 👈 Exclude current user
                        .map(user => (
                        <li key={user.id} onClick={() => {
                          // Your existing code
                          setDefaultScreen(false)
                          setSelectedUser(user);
                          setIsChatOpen(true);
                          setMainScreen(true)
                          setUserListContainer(false)
                          // Initiate WebSocket connection inside the onClick handler
                          sendChatOpenedAction(currentUserRef.id, user.id)
                        }}
                          className={selectedUser?.id === user.id ? "selected" : ""}>
                            <div style={{'display':'flex'}}>
                            <img className="user-profile" src= {user.profile || profile}
                              alt="user" onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = profile; // default avatar
                            }}/>
                            </div>
                            <div className="user-detail">
                            <p>{user.username}</p>
                            <div style={{display:"flex"}}>
                            {user.last_message?.sender_id===currentUserRef.id && (
                                 <span className="last-media" >You :  </span>
                            )}
                             {user.last_message?.message_type === "text" && (
                            <span className="last-media">{
                            user.last_message?.message || ''}</span>
                             )}
                              {user.last_message?.message_type === "file" && !user.last_message?.mime.startsWith("image/") && (
                              
                                <div>

                                <FaFileAlt size={13} style={{ color: 'var(--third-color', fontSize:"12px"}} />
                                <span style={{ color: 'var(--third-color'}}> document</span>
                                </div>
                                
                             )}
                             {user.last_message?.message_type === "file" && user.last_message?.mime.startsWith("image/") && (
                              
                               <div>

                                <FaFileImage size={13} style={{ color: 'var(--third-color', fontSize:"12px"}} />
                                <span style={{ color: 'var(--third-color'}}> Image</span>
                                </div>
                             )}
                           
                            {user.count >0 &&(
                            <div className="unread-message-count">
                              <p>{user.count}</p>
                            </div>
                            )}
                            </div>
                            </div>
                        </li>
                        ))}
                    </ul>
                </div>
                </div>
                <div className="profile-details-screen" style={{display:showProfile? "block":"none"}}>
                <div className="message-header contact-header">
                    <h3>Profile</h3>
                     {isMobile &&(
                           <div onClick={toggleMenuItemsForMobile}>
                    <i className="fas fa-bars" style={{ display: 'block', color:'white' }}></i>
                    <SidebarMenu
                    isopen={showMenuItemsMobile}
                    currentUserRef= {currentUserRef}
                    showLogoutUser={setIsDialogueBox}
                    showProfile={setShowUserProfile} 
                    showChatList={setShowUsersList}
                    showChat={setIsChatOpen}
                    showMainChatScreen={setMainScreen}
                    showUserListDiv={setUserListContainer}
                    setIsOpen={setMenuItemsForMobile}
                    />
                    <ConfirmDialog
                        isOpen={isDialogOpen}
                        message={`Are you sure, you want to logout?`}
                        onConfirm={logoutUser}
                        onCancel={handleCancel}
                    />
                    </div>
                    )}
                </div>
                      <img src={currentUserRef.profile || profile} className="user-profile-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = profile; // default avatar
                      }}
                      ></img>
                      <div className="edit-profile-button">
                      <button  onClick={() => setIsUploadMedia(true)} style={{display:!IsUploadProfile? 'block':'none'}}>Edit Profile</button>
                      </div>
                      {IsUploadProfile && (
                      <UploadImage onUploadSuccess={handleUploadMedia} id={currentUserRef.id} />
                    )}

                      {!IseditUserName && (
                        <div className="edit-user-name">
                          <p>{currentUserRef.username}</p>
                          <i className="fas fa-pencil-alt" onClick={handleSetEditUser}></i>
                        </div>
                      )}

                      {IseditUserName && (
                        <div className="save-user-name">
                          <input
                            value={userNameOnEdit}
                            onChange={(e) => setUserNameOnEdit(e.target.value)}
                            className="edit-name"
                          />
                          <i className="fas fa-check" onClick={editUser}></i>
                        </div>
                      )}
                </div>
            
            
            </div>
            <div className="show-main-screen"  style={{
                display: isMobile ? (isMainScreen ? 'block' : 'none') : 'block'
              }}>
              <div className="show-default-screen" style={{display:isDefaultScreen?"flex":"none"}}>
                <img src={defaulScreenBg}></img>
                <p>
                Explore the app and start a conversation when you're ready!
                </p>

              </div>
            <div className="chat-screen-container" style={{ display: isChatOpen ? "block" : "none" }}>
            <div className="profile-header chat-screen-header">
                   <div className="user-info-header">
                     {isMobile &&(
                     <button className="goBack" onClick={()=>{
                      setUserListContainer(true)
                      setMainScreen(false)
                     }}>
                     <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
                     </button>
                     )}
                     
                    <img 
                      src={selectedUser?.profile?.trim() ? selectedUser.profile : profile}
                      alt="User"
                      onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = profile; // default avatar
                    }}
                    />

                    <span>{selectedUser?.username || 'Select a user'}</span>
                    </div>
            </div>
            <div className="chat-container">
              
            {chatHistory.length > 0 && (
              
              <ul  className="chats-text" ref={containerRef}>
              {[...chatHistory]
                .filter(messages => (messages.receiver_id === currentUserRef.id && messages.sender_id===selectedUser.id) || (messages.receiver_id === selectedUser.id && messages.sender_id===currentUserRef.id))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // ✅ Old to new
                .map((UserMessage, index) => (
                  <div  key={index} className={UserMessage.sender_id === currentUserRef.id ? 'sender-text' : 'receiver-text'}>
                  <p className="chat-time">
                    {new Date(UserMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}</p>
                 {UserMessage.message_type === "text" && (
                    <li key={index}>{UserMessage.message}</li>
                  )}

                      {UserMessage.message_type === 'file' && (
                        
                        <>
                          {getMediaCategoryFromMime(UserMessage.mime) === 'video' ? (
                            <li className="fileMessage" key={index}>
                              <video width="100%" height="auto" controls>
                                <source src={UserMessage.file_path} type={UserMessage.mime} />
                                Your browser does not support the video tag.
                              </video>
                            </li>
                            
                          ) : getMediaCategoryFromMime(UserMessage.mime) === 'image' ? (
                            <li className="fileMessage" key={index}>
                              
                              <img src={`${API_URL}${encodeURI(UserMessage.file_path)}`} alt="Sent file" className="chat-image-size"/>
                              
                            </li> 
                          ) : getMediaCategoryFromMime(UserMessage.mime) === 'doc' ? (
                            <li className="fileMessage" key={index}>
                              <embed 
                                src={`${API_URL}${encodeURI(UserMessage.file_path)}`} 
                                type={UserMessage.mime}
                                width="300" 
                                height="100" 
                              />
                            </li>
                          ) : (
                            <li className="fileMessage" key={index}>
                              Unsupported file type
                            </li>
                          )}
                        </>
                  )}
                  {UserMessage.sender_id == currentUserRef.id &&(
                  <div className="message-status">
                    {getStatusIcon(UserMessage.status)}
                  </div>
                  )}
                  </div>
                ))}
            </ul>
            )}
            </div>
            <div className="message-input">
              <button onClick={showSendMediaOnclick}><i className="fas fa-plus"></i></button>
              {showSendMedia && (
                <SendMedia sendMessage={sendChatOpenedActionWithMessage}  handleClose={closeSendMediaOnclick}
                sender_id={currentUserRef.id}      // <-- pass sender id here
                receiver_id={selectedUser.id}
                message_type = "file"
                />
              )}
                  <input className="message-area" ref={inputRef} placeholder="Type a message" onChange={handleInputMessage} value={inputText} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendChatOpenedActionWithMessage(currentUserRef.id, selectedUser.id , "text");
                        }
                      }}>

                  </input>
              {((!showSendButton || islistening)) &&  (
                    
                    <button onClick={toggleSpeechListening}>
                      <i className="fas fa-microphone" style={{display:islistening? 'none':'block'}}></i>
                      <i className="fas fa-pause-circle" style={{ display:islistening? 'block':'none', color: 'red', fontSize: '25px'}}></i>
                    </button>
                  )}
              {showSendButton && (
                <button onClick={() => {
                  if (!islistening) {
                    sendChatOpenedActionWithMessage(currentUserRef.id, selectedUser.id, "text");
                  }
                }}>
                  <i className="fas fa-paper-plane"></i>
                  
                  </button>
                  
              )}
              <SpeechToText listening={islistening} onSpeechResult ={handleSpeechResult} />
            </div>
            
            </div>
            </div>
        </div>

    )
}