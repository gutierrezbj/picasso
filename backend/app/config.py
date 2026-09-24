import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR_YAML = BASE_DIR / "data"


class Config:
    MONGO_URL = os.environ["MONGO_URL"]
    DB_NAME = os.environ["DB_NAME"]
    DATA_DIR = os.environ.get("DATA_DIR", str(BASE_DIR / "data" / "media"))
    MONEDA = os.environ.get("MONEDA", "USD")
    PRESUPUESTO_POR_DEFECTO = float(os.environ.get("PRESUPUESTO_POR_DEFECTO") or 0)


config = Config()
