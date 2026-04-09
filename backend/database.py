import motor.motor_asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# --- MongoDB (New Auth & Subscription) ---
class Database:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db = None

db = Database()

async def get_database() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    if db.client is None:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
        db.db = db.client.get_database("toolbox_hub")
    return db.db

async def close_db_connection():
    if db.client:
        db.client.close()

# --- SQLAlchemy (Legacy Tools Compatibility) ---
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
