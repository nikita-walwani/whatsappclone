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
