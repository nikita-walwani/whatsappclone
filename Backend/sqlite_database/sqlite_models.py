from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from .sqlite_config import Base
from sqlalchemy.orm import relationship



class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(String, index=True)
    receiver_id = Column(String, index=True)
    message = Column(String)
    status = Column(String, default="sent")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    media_id = Column(Integer, ForeignKey("media.id"), nullable=True)
    message_type=Column(String)

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String)
    file_type = Column(String)  # image, video, document, etc.
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))