from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import Desarrollo

router = APIRouter(prefix="/api", tags=["desarrollo"])


@router.get("/proyectos/{proyecto_id}/desarrollo")
async def obtener_desarrollo(proyecto_id: str):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    doc = await db.desarrollos.find_one({"_id": proyecto_id})
    if not doc:
        return Desarrollo().model_dump()
    return sin_id(doc)


@router.put("/proyectos/{proyecto_id}/desarrollo")
async def guardar_desarrollo(proyecto_id: str, datos: Desarrollo):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    doc = datos.model_dump()
    doc["_id"] = proyecto_id
    await db.desarrollos.replace_one({"_id": proyecto_id}, doc, upsert=True)
    return sin_id(doc)
