import React, { useState } from "react";
import ConfirmDialog from "./confirmDialog"; 
import profile from "../images/profile.png"

const SidebarMenu = ({isopen, currentUserRef, showLogoutUser, showProfile, showChatList, showChat, showMainChatScreen, showUserListDiv}) => {
  if(!isopen){
    return null;
  }
  
  
  const logoutUser=()=>{
    showLogoutUser(true)
    
  }

  const userProfile=()=>{
    showProfile(true)
    showChat(false)
    showLogoutUser(false)
    showMainChatScreen(false)
    showUserListDiv(true)
    showChatList(false)
  }
  
  const chatList=()=>{
    showChatList(true)
    showChat(false)
    showLogoutUser(false)
    showMainChatScreen(false)
    showUserListDiv(true)
    showProfile(false)
  }
  
 
  
  return (
    <div style={toggleButton}>
        <button onClick={chatList} style={buttons}>
            <i className="fas fa-comment-dots" style={buttonIcon}></i>Chats
        </button>
        <button  onClick={userProfile} style={buttons}>
            <img src={currentUserRef.profile || profile} style={buttonImg}  className="profile-img"></img>Profile
        </button>
        <button onClick={logoutUser} style={buttons}>
            <i className="fas fa-sign-out-alt" style={buttonIcon}></i>Log Out 
        </button>
    </div>
  );
};

export default SidebarMenu;


const toggleButton={
    position: 'absolute',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--detailing-color)',
    zIndex:'10',
    boxShadow:'-2px 4px 7px black',
    width:'60%' 
}

const buttons={
background:'none',
border:'none',
borderBottom:'1px solid var(--underlines)',
color:'var(--text-color)',
display:'flex',
justifyContent:'left',
alignItems:'center',
padding:'10px',
columnGap : '10px'
}

const buttonImg ={
    width : '25px',
    height:'25px'
    
}

const buttonIcon= {
    fontSize:'18px'
}