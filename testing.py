import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
db_path = BASE_DIR / "Backend/sqlite_database/data/chat_history.db"  # fix the path

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM chat_messages;")
    rows = cursor.fetchall()

    for row in rows:
        print(row)  # This prints the tuple of each row

except sqlite3.Error as e:
    print(f"SQLite error: {e}")
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()


