import time


def create_message_data(user_id, receiver_id, parsed_data):
    message_data = {
        "userId": user_id,
        "receiver_id": receiver_id,
        "type": parsed_data["data"]["type"],
        "timestamp": int(time.time() * 1000),
        "status": "sent",
    }
    if parsed_data["data"]["type"] == "text":
        message_data["text"] = parsed_data["data"]["message"]
    return message_data

