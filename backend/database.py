import motor.motor_asyncio
from config import settings

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
