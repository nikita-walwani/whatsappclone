import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;  
// token will be passed as an argument for flexibility
export const fetchMessages = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}/messages/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // You can handle error here or throw it to the caller
    console.error('Error fetching messages:', error);
    throw error;
  }
};



export const updateMessageStatus = async (token, messages_list) => {
  try {
    const response = await axios.put(
      `${API_URL}/messages/update-status`,
      messages_list,  // This is the request body (List of messages)
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating message statuses:", error);
    throw error;
  }
};


