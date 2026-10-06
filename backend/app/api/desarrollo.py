from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import Desarrollo, ahora

router = APIRouter(prefix="/api", tags=["desarrollo"])


@router.get("/proyectos/{proyecto_id}/desarrollo")
async def obtener_desarrollo(proyecto_id: str):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    doc = await db.desarrollos.find_one({"_id": proyecto_id})
    if not doc:
        return Desarrollo().model_dump()
    return _recuperar_respuestas_antiguas(sin_id(doc))


def _recuperar_respuestas_antiguas(des: dict) -> dict:
    """Brief rediseñado (§6.1): las preguntas que repetían otra desaparecen y
    su respuesta pasa a su sitio nuevo si ese sitio está vacío."""
    resp = dict(des.get("respuestas_formato") or {})
    for vieja in ("uso", "canal"):
        texto = (resp.get(vieja) or "").strip()
        if texto and not (des.get("destino_detalle") or "").strip():
            des["destino_detalle"] = texto
        resp.pop(vieja, None)
    objetivo = (resp.pop("objetivo", None) or "").strip()
    if objetivo and not (des.get("intencion") or "").strip():
        des["intencion"] = objetivo
    resp.pop("duracion", None)
    des["respuestas_formato"] = resp
    return des


@router.put("/proyectos/{proyecto_id}/desarrollo")
async def guardar_desarrollo(proyecto_id: str, datos: Desarrollo):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    guardado = await db.desarrollos.find_one({"_id": proyecto_id})
    if guardado and guardado.get("updated_at") != datos.updated_at:
        raise HTTPException(409, "El desarrollo se ha modificado en otro sitio. Recarga o sobrescribe.")
    doc = datos.model_dump()
    doc["updated_at"] = ahora()
    doc["_id"] = proyecto_id
    await db.desarrollos.replace_one({"_id": proyecto_id}, doc, upsert=True)
    return sin_id(doc)
