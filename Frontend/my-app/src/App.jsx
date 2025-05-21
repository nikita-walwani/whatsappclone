import React from 'react';
import './index.css';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatRoom from './components/ChatRoom';
import Chat from './components/chatInterface';
import AuthValidator from './components/CheckUserToken'; // 🔐 Import the new component
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Route */}
        <Route
          path="/"
          element={
            <AuthValidator>
              <ChatRoom />
            </AuthValidator>
          }
        />
        
        <Route
          path="/chat"
          element={
            <AuthValidator>
              <Chat/>
            </AuthValidator>
          }
        />


        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
