from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio import recorridos
from app.dominio.modelos import (
    Espacio,
    EspacioCrear,
    EspacioEditar,
    ahora,
)

router = APIRouter(prefix="/api", tags=["espacios"])


async def _resumen_espacio(esp: dict) -> dict:
    proyectos = await db.proyectos.find({"espacio_id": esp["id"]}).to_list(1000)
    num = len(proyectos)
    en_curso = 0
    for p in proyectos:
        estado = recorridos.calcular(p)
        if estado["paso_actual"] is not None:
            en_curso += 1
    return {**esp, "num_proyectos": num, "num_en_curso": en_curso}


@router.get("/espacios")
async def listar_espacios():
    docs = await db.espacios.find({"archivado": {"$ne": True}}).sort("created_at", -1).to_list(1000)
    return [await _resumen_espacio(sin_id(d)) for d in docs]


@router.post("/espacios", status_code=201)
async def crear_espacio(datos: EspacioCrear):
    esp = Espacio(**datos.model_dump())
    doc = esp.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.espacios.insert_one(doc)
    return await _resumen_espacio(esp.model_dump(mode="json"))


@router.get("/espacios/{espacio_id}")
async def obtener_espacio(espacio_id: str):
    doc = await db.espacios.find_one({"_id": espacio_id})
    if not doc:
        raise HTTPException(404, "Espacio no encontrado")
    return await _resumen_espacio(sin_id(doc))


@router.patch("/espacios/{espacio_id}")
async def editar_espacio(espacio_id: str, datos: EspacioEditar):
    doc = await db.espacios.find_one({"_id": espacio_id})
    if not doc:
        raise HTTPException(404, "Espacio no encontrado")
    if doc["updated_at"] != datos.updated_at:
        raise HTTPException(409, "El espacio se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {k: v for k, v in datos.model_dump(exclude={"updated_at"}).items() if v is not None}
    cambios["updated_at"] = ahora()
    await db.espacios.update_one({"_id": espacio_id}, {"$set": cambios})
    doc = await db.espacios.find_one({"_id": espacio_id})
    return await _resumen_espacio(sin_id(doc))


@router.delete("/espacios/{espacio_id}", status_code=204)
async def borrar_espacio(espacio_id: str):
    await db.proyectos.delete_many({"espacio_id": espacio_id})
    await db.espacios.delete_one({"_id": espacio_id})
    return None
