// src/utils/dateFormatter.js

export function convertToISOTimestamp(msTimestamp) {
  const date = new Date(msTimestamp);

  const iso = date.toISOString(); // e.g., "2025-05-19T16:43:19.361Z"
  const [datePart, timePart] = iso.split("T");
  const [hhmmss, msAndZone] = timePart.split(".");
  const ms = msAndZone.slice(0, 3); // "361"

  return `${datePart}T${hhmmss}.${ms}000`; // e.g., "2025-05-19T16:43:19.361000"
}


export const processUsersWithMessages = (usersList, chatHistory) => {
 
  return usersList.map(user => {
    const userMessages = chatHistory.filter(msg => msg.sender_id === user.id || msg.receiver_id === user.id);
    const sortedMessages = [...userMessages].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const count = userMessages.filter(
      msg => (msg.status === 'delivered' || msg.status === 'sent') && msg.sender_id===user.id
    ).length;

    return {
      ...user,
      last_message: sortedMessages[0],
      count: count,
    };
  });
};

export const updateUserWithLastMessage = (userList, messages) => {
  return userList.map(user => {
    // Messages related to this user as sender or receiver
    const relatedMessages = messages.filter(
      msg => msg.sender_id === user.id || msg.receiver_id === user.id
    );
    if (relatedMessages.length === 0) {
      return user;
    }
    // Latest message by timestamp
    const lastMessage = relatedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Count only messages where status is "sent" or "delivered" AND receiver_id is the user.id
    const count = relatedMessages.reduce((acc, msg) => {
      if ((msg.status === "sent" || msg.status === "delivered") && msg.sender_id === user.id) {
        return acc + 1;
      }
      return acc;
    }, 0);

    return {
      ...user,
      last_message: lastMessage[0],
      count: count
    };
  });
};


export const updateMessageInChatHistory = (chatHistory, updateIds, current_user_id, selected_user_id) => {
  if (!Array.isArray(updateIds) || updateIds.length === 0) {
    return chatHistory;
  }
  updateIds = updateIds.filter(id => id != null);
  return chatHistory.map(chat => {
    if (
      updateIds.includes(chat.id) &&
      chat.receiver_id === current_user_id &&
      chat.sender_id === selected_user_id
    ) {
      return {
        ...chat,
        status: "read"
      };
    }
    return chat;
  });
};
