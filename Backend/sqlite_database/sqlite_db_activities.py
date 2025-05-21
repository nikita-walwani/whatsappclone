from datetime import datetime, timezone

from sqlalchemy import update
from sqlite_database.sqlite_models import ChatMessage, Media
from sqlite_database.sqlite_config import SessionLocal
import uuid
from pathlib import Path

# Ensure media directory exists
MEDIA_DIR = Path(__file__).resolve().parent / "media"
MEDIA_DIR.mkdir(exist_ok=True)

async def save_message_to_db(message_data: dict):
    async with SessionLocal() as session:
        media_id = None
        if message_data["type"] == "file":
            file_bytes = message_data.get("file")
            mime_type = message_data.get("mime")
            original_name = message_data.get("filename")

            # Generate a unique file name
            unique_filename = f"{uuid.uuid4()}_{original_name}"
            file_path = MEDIA_DIR / unique_filename

            # Save file bytes to disk
            try:
                if isinstance(file_bytes, str):
                    file_bytes = file_bytes.encode("utf-8")  # or handle base64 if needed

                with open(file_path, "wb") as f:
                    f.write(file_bytes)
            except Exception as e:
                print(f"File saving failed: {e}")
                return  # Skip saving if media can't be saved

            # Save media metadata to DB
            media_record = Media(
                file_name=original_name,
                file_type=mime_type,
                file_path=str(file_path),
                uploaded_at=datetime.now(timezone.utc)
            )
            session.add(media_record)
            await session.flush()  # Get auto-generated `id`
            media_id = media_record.id
            

        # Save chat message
        chat_msg = ChatMessage(
            sender_id=message_data["userId"],
            receiver_id=message_data["receiver_id"],
            message=message_data.get("text"),
            status=message_data.get("status", "sent"),
            timestamp=datetime.fromtimestamp(message_data["timestamp"] / 1000.0, tz=timezone.utc),
            media_id=media_id,
            message_type=message_data["type"]
        )

        session.add(chat_msg)
        await session.flush()
        await session.commit()
        return chat_msg.id if chat_msg.id else None

       

async def update_message_statuses(message_ids: list[int], new_status: str):
    async with SessionLocal() as session:
        stmt = (
            update(ChatMessage)
            .where(ChatMessage.id.in_(message_ids))
            .values(status=new_status)
        )
        await session.execute(stmt)
        await session.commit()
        return {"updated_ids": message_ids, "new_status": new_status}