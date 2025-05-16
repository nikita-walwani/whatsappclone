import React, { useState } from "react";

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const UploadImage = ({ onUploadSuccess , id}) => {  
  
  const userId = id;
  const token = localStorage.getItem("access_token") // Replace with actual user ID
  const [file, setFile] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  
  const handleFileChange = (e) => {
  const selectedFile = e.target.files?.[0];
  

  if (selectedFile) {
    setFile(selectedFile); // update state
    setIsButtonDisabled(false);
  } else {
   
    setIsButtonDisabled(true);
  }
};
  const handleUpload = async () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("media_type", "profile_image"); // Optional but good to include
    formData.append("file", file);

    
    try {
        const res = await fetch(`${API_URL}/upload-media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type manually when using FormData
          },
          body: formData,
        });
        if (res.status==401){
          localStorage.removeItem('access_token');
          window.location.href = '/login'; 
          return; 
        }

        const data = await res.json();
        if (onUploadSuccess) {
          onUploadSuccess(data); // 🔁 pass the response back to parent
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    };

    return (
        <div style={profileEditButtons}>
          <input type="file" accept="image/*" onChange={handleFileChange} style={uploadProfile}>
          </input>
          {isButtonDisabled && (
            <button style={isButtonDisabled? disabledButton:buttonSelection}  disabled >Upload Profile Image</button>
          )}
          {!isButtonDisabled &&(
          <button onClick={handleUpload} style={isButtonDisabled? disabledButton:buttonSelection}  disabled={isButtonDisabled}>Upload Profile Image</button>
          )}
        </div>
      );
};


export default UploadImage;


const profileEditButtons = 
  {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: '10px'
}
    
const buttonSelection = {
  background:'var(--accent-color)',
  border:'none',
  color:'white',
  cursor: 'pointer',
  padding:'8px',
  borderRadius:'4px'
}
const uploadProfile ={
  background:'none',
  border:'1px solid white',
  color:'white',
  cursor: 'pointer',
  padding:'8px',
  borderRadius:'4px'
}

const disabledButton={
  background:'var(--detailing-color)',
  cursor:'not-allowed',
  color:'grey',
  padding:'8px',
  borderRadius:'4px',
  boxShadow:'none',
  border:'none'
}
