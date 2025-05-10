import React, { useState } from "react";
import gallery from '../images/gallery.png'
import play from '../images/play.png'
import docs from '../images/google-docs.png'

export default function SendMedia({ sendMessage, handleClose}) {
  const [selectedFile, setSelectedFile] = useState(null);


  const handleFileSelect = (file) => {
    setSelectedFile(file);
    
  };


  return (
   
    <div style={{
      ...popUpStyle,
      transform: true ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
      opacity: true ? 1 : 0,
      transition: 'all 0.3s ease-in-out'
    }}>
      <button>
        <i
          className="fas fa-times"
          onClick={handleClose}
          style={crossButton}
        ></i>
      </button>

      {/* Image Upload */}
      <label htmlFor="imageInput" style={{ cursor: 'pointer' }}>
        <img src={gallery} alt="Upload" style={imageStyle} />
      </label>
      <input
        type="file"
        accept="image/*"
        id="imageInput"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

      {/* Video Upload */}
      <label htmlFor="videoInput" style={{ cursor: 'pointer' }}>
        <img src={play} alt="Upload" style={imageStyle} />
      </label>
      <input
        type="file"
        accept="video/*"
        id="videoInput"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

      {/* Document Upload */}
      <label htmlFor="docInput" style={{ cursor: 'pointer' }}>
        <img src={docs} alt="Upload" style={imageStyle} />
      </label>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        id="docInput"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />
      {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      
      <button
        onClick={() => {
            if (selectedFile) {
              sendMessage(selectedFile);
              handleClose();
            }
          }}
        style={{
          display: 'block',
          width: '100%',
          background: 'var(--primary-color)',
          color: 'white',
          borderRadius: '5px',
          marginTop: '10px'
        }}
      >
        Send
      </button>
    </div>
    
   
    
  );
}

// Base popup style
const popUpStyle = {
  position: 'absolute',
  left: '15%',
  bottom: '0',
  background: 'white',
  boxShadow: '0 0 10px black',
  padding: '20px',
  zIndex: 100,
  //transform: 'translate(-50%, -50%) scale(0.8)',
  opacity: 0,
};

const imageStyle = {
  height: '50px',
  margin: '10px',
};

const crossButton={
    position: 'absolute',
    top: '-20px',
    right: '-20px',
    background: 'var(--accent-color)',
    padding: '10px',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    lineHeight: '20px',
    cursor:'pointer',
    fontSize:'20px',
    color:'white'
}

