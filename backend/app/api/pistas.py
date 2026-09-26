"""Pistas de música y ambiente de una pieza (§3.1 «PistaAudio», §11.2).

Se importan de la biblioteca del espacio (medios de audio) y se colocan en la
pieza con su inicio y su volumen. Quitar una pista no borra el audio de la
biblioteca.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import PistaAudio, PistaAudioCrear, PistaAudioEditar, ahora

router = APIRouter(prefix="/api", tags=["pistas"])


async def _vista(doc: dict[str, Any]) -> dict[str, Any]:
    pista = sin_id(doc)
    medio = await db.medios.find_one({"_id": pista["medio_id"]})
    pista["duracion_s"] = (medio or {}).get("duracion_s")
    pista["medio_nombre"] = (medio or {}).get("nombre_original")
    return pista


async def _pieza_y_espacio(pieza_id: str) -> tuple[dict[str, Any], str]:
    pieza = await db.piezas.find_one({"_id": pieza_id})
    if not pieza:
        raise HTTPException(404, "Pieza no encontrada")
    proy = await db.proyectos.find_one({"_id": pieza["proyecto_id"]})
    return sin_id(pieza), (proy or {}).get("espacio_id")


@router.get("/piezas/{pieza_id}/pistas")
async def pistas_de_pieza(pieza_id: str):
    await _pieza_y_espacio(pieza_id)
    docs = await db.pistas_audio.find({"pieza_id": pieza_id}).sort("inicio_s", 1).to_list(200)
    return [await _vista(d) for d in docs]


@router.post("/piezas/{pieza_id}/pistas", status_code=201)
async def anadir_pista(pieza_id: str, datos: PistaAudioCrear):
    _, espacio_id = await _pieza_y_espacio(pieza_id)
    medio = await db.medios.find_one({"_id": datos.medio_id})
    if not medio or medio.get("espacio_id") != espacio_id:
        raise HTTPException(404, "Ese audio no está en la biblioteca de este espacio.")
    if medio.get("clase") != "audio":
        raise HTTPException(409, "Una pista de música o ambiente tiene que ser un audio.")
    pista = PistaAudio(
        pieza_id=pieza_id,
        capa=datos.capa,
        medio_id=datos.medio_id,
        nombre=datos.nombre or medio.get("nombre_original") or "",
        inicio_s=datos.inicio_s,
        volumen_db=datos.volumen_db,
    )
    doc = pista.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.pistas_audio.insert_one(doc)
    return await _vista(doc)


@router.patch("/pistas/{pista_id}")
async def editar_pista(pista_id: str, datos: PistaAudioEditar):
    doc = await db.pistas_audio.find_one({"_id": pista_id})
    if not doc:
        raise HTTPException(404, "Pista no encontrada")
    cambios = {k: v for k, v in datos.model_dump().items() if v is not None}
    cambios["updated_at"] = ahora()
    await db.pistas_audio.update_one({"_id": pista_id}, {"$set": cambios})
    return await _vista(await db.pistas_audio.find_one({"_id": pista_id}))


@router.delete("/pistas/{pista_id}", status_code=200)
async def quitar_pista(pista_id: str):
    doc = await db.pistas_audio.find_one({"_id": pista_id})
    if not doc:
        raise HTTPException(404, "Pista no encontrada")
    await db.pistas_audio.delete_one({"_id": pista_id})
    return {"ok": True}
