import React from 'react';

export default function confirmDialog({isOpen, message, onConfirm, onCancel}){
    if (!isOpen) return null

    return(
        
            <div style={overlayStyle}>
              <div style={dialogStyle}>
                <p>{message}</p>
                <div>
                  <button style={{ ...buttonStyle, ...confimButton }} onClick={onConfirm}>Confirm</button>
                  <button style={{...buttonStyle, ...cancelButton}} onClick={onCancel}>Cancel</button>
                </div>
              </div>
            </div>
          
    );
};


const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  
  const dialogStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    textAlign: 'center',
  };

const buttonStyle= {
    width:'100%',
   color:'white',
   borderRadius:'5px',
   padding:'10px',
   fontSize:'16px'
}

const confimButton={
    backgroundColor:'var(--accent-color)'
}

const cancelButton={
    backgroundColor:'none',
    border:'2px solid var(--primary-color)',
    color:'black'
}
