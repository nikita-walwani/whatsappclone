import React, { useState } from 'react';
import "../css/login.scss";
import logo from '../images/login-screen-logo.png';
import "../css/style.css";
import bg from "../images/chat-bg.jpg"
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 


const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export default function Login() {

  const [formData, setFormData] = useState({
    email:"",
    password:""
  });

  const [showPassword, setPassword] =useState(false)

  const togglePassword = ()=>{
       setPassword(!showPassword)
  }

  const handleChange=(e)=>{
    setFormData({...formData, [e.target.name]:e.target.value})
    
  }
  const handleSubmit=async (e)=>{
    e.preventDefault()

    try{
       const response =  await fetch(`${API_URL}/login`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(formData)
         });
        const data = await response.json();
        
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("current_user", JSON.stringify(data.user));
          window.location.href = "/"; // Redirect to the homepage or another page
        } 
        else{
          alert(data.detail || "Signup failed");
        }
  
      }
      catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
      }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 login-bg">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md login">
        <img src={bg} className='chat-bg'></img>
        <img src={logo} className='login-logo'></img>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className='space-input'>
          <input
            name='email'
            type="email"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
            autoComplete="email" 
            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          />
          </div>
          <div className='relative mb-4 space-input pass-input'>
          <input
            name='password'
            type={showPassword?"text":"password"}
            placeholder='password'
            onChange={handleChange}
            value={formData.password}
            autoComplete="current-password" 
            className="w-full p-3 border border-gray-300 rounded-md pr-10"
          />
           <span  
                    className="absolute password-eye"
                    onClick={togglePassword}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                  </div>
                
          <button type='submit' className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 sign-up-button">
          
            Login
           
            
          </button>
        </form>
        <p className="text-sm mt-4 text-center text-gray-500">
          Don't have an account? <a className="text-blue-600 hover:underline" href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
