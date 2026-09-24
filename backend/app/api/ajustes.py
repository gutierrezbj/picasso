from __future__ import annotations

from fastapi import APIRouter

from app.config import config
from app.db import db, sin_id
from app.dominio.modelos import Ajustes, AjustesEditar

router = APIRouter(prefix="/api", tags=["ajustes"])


async def _asegurar() -> dict:
    doc = await db.ajustes.find_one({"_id": "global"})
    if not doc:
        aj = Ajustes(moneda=config.MONEDA, presupuesto_por_defecto=config.PRESUPUESTO_POR_DEFECTO)
        doc = aj.model_dump(mode="json")
        doc["_id"] = "global"
        await db.ajustes.insert_one(doc)
    return doc


@router.get("/ajustes")
async def obtener_ajustes():
    return sin_id(await _asegurar())


@router.put("/ajustes")
async def guardar_ajustes(datos: AjustesEditar):
    await _asegurar()
    cambios = {k: v for k, v in datos.model_dump().items() if v is not None}
    if cambios:
        await db.ajustes.update_one({"_id": "global"}, {"$set": cambios})
    return sin_id(await db.ajustes.find_one({"_id": "global"}))
