import os
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db = None

db = MongoDB()

async def connect_to_mongo():
    """Connect to MongoDB on startup with active ping and fallback."""
    mongo_url = getattr(settings, "MONGODB_URL", os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/grambiz_ai"))
    db_name = getattr(settings, "MONGODB_DB_NAME", os.getenv("MONGODB_DB_NAME", "grambiz_ai"))
    
    # 1. Try configured URL
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=3000)
        await client.admin.command("ping")
        db.client = client
        db.db = client[db_name]
        logger.info(f"Successfully connected to MongoDB ({mongo_url}) database: {db_name}")
        return
    except Exception as e:
        logger.warning(f"Configured MongoDB url connection failed ({e}). Attempting local fallback mongodb://127.0.0.1:27017...")

    # 2. Try local MongoDB instance
    try:
        fallback_client = AsyncIOMotorClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=2000)
        await fallback_client.admin.command("ping")
        db.client = fallback_client
        db.db = fallback_client[db_name]
        logger.info(f"Successfully connected to local MongoDB instance: {db_name}")
    except Exception as err:
        logger.error(f"Local MongoDB also unreachable ({err}). Endpoints will use in-memory fallback.")
        db.client = None
        db.db = None

async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    if db.client:
        db.client.close()
        logger.info("Closed MongoDB connection.")

def get_database():
    """Helper to get active db instance (or None if offline)."""
    return db.db

def is_mongo_connected() -> bool:
    return db.db is not None
