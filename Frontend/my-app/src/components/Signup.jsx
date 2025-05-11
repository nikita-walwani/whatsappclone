import React, { useState } from 'react';
import "../css/signup.css"
import "../css/style.css"
import enter from "../images/enter.png"
import bg from "../images/chat-bg.jpg"
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 


const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;


export default function Signup() {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const [showPassword, setPasswrod]=useState(false);

  const togglePassword=()=>{
    setPasswrod(!showPassword)
  }

  const handleChange=(e)=>{
    setFormData({...formData, [e.target.name]:e.target.value})
    
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
     
    
    try{
      const response = await fetch(`${API_URL}/register`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(formData)
      });
      const data = await response.json()

      if(response.ok){
        window.location.href = "/login";
      }
      else{
        alert(data.detail || "Signup failed");
      }

    }
    catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };
    

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md signup">
        <img src={bg} className='chat-bg'></img>
        <img src={enter}></img>
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className='space-input'>
          <input
            name='name'
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          </div>
          <div className='space-input'>
          <input
            name='email'
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          />
          </div>
          <div className='relative mb-4 space-input'>
          <input 
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md pr-10"
          />
           <span
          className="absolute right-3 top-3 text-gray-500 cursor-pointer pass-icon"
          onClick={togglePassword}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>

</div>
          <button  type='submit' className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 login-up-button">
            Create Account
          </button>
        </form>
        <p className="text-sm mt-4 text-center text-gray-500">
          Already have an account? <a className="text-green-600 hover:underline" href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
