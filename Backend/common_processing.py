import time


def create_message_data(user_id, receiver_id, parsed_data):
    message_data = {
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "message_type": parsed_data["data"]["type"],
        "timestamp": int(time.time() * 1000),
        "status": "sent",
    }
    if parsed_data["data"]["type"] == "text":
        message_data["message"] = parsed_data["data"]["message"]
    if parsed_data["data"]["type"] == "file":
        message_data["file"] = parsed_data["data"]["byte"]
        message_data["filename"] = parsed_data["data"]["filname"]
        message_data["mime"] = parsed_data["data"]["mime"]
    return message_data

