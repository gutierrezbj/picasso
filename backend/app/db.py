from motor.motor_asyncio import AsyncIOMotorClient

from app.config import config

client = AsyncIOMotorClient(config.MONGO_URL)
db = client[config.DB_NAME]


def sin_id(doc: dict) -> dict:
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc
