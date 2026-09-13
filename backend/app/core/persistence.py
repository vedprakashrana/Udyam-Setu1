import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
ASSESSMENTS_FILE = os.path.join(DATA_DIR, "assessments_store.json")
USERS_FILE = os.path.join(DATA_DIR, "users_store.json")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def load_assessments_store() -> Dict[str, Any]:
    ensure_data_dir()
    if os.path.exists(ASSESSMENTS_FILE):
        try:
            with open(ASSESSMENTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load assessments store: {e}")
    return {}

def save_assessments_store(data: Dict[str, Any]):
    ensure_data_dir()
    try:
        serializable = {}
        for k, v in data.items():
            item = dict(v)
            if isinstance(item.get("created_at"), datetime):
                item["created_at"] = item["created_at"].isoformat()
            serializable[k] = item
        with open(ASSESSMENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, default=str)
    except Exception as e:
        logger.warning(f"Failed to save assessments store: {e}")

def load_users_store() -> Dict[str, Any]:
    ensure_data_dir()
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load users store: {e}")
    return {}

def save_users_store(data: Dict[str, Any]):
    ensure_data_dir()
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.warning(f"Failed to save users store: {e}")
