from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Dynamically get the current directory of this file
BASE_DIR = Path(__file__).resolve().parent

# Optional: Put DB inside a "data" subfolder (recommended for organization)
DB_DIR = BASE_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)  # Create folder if it doesn't exist

DB_PATH = DB_DIR / "chat_history.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# Async SQLAlchemy setup
engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()
