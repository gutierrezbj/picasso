"""Exportar el paquete de edición (§11.3). Es un trabajo en segundo plano con
progreso visible y sin coste: nada se envía a ningún proveedor."""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import config
from app.db import db, sin_id
from app.dominio.modelos import ahora, nuevo_id
from app.exportar import paquete

router = APIRouter(prefix="/api", tags=["exportaciones"])

RAIZ = Path(config.DATA_DIR) / "exportaciones"


class PedirExportacion(BaseModel):
    alternativas: bool = False
    rutas: Literal["relativas", "absolutas"] = "relativas"
    carpeta_destino: Optional[str] = None  # solo con rutas absolutas


async def _trabajar(exp_id: str, pieza_id: str, datos: PedirExportacion) -> None:
    async def progreso(pct: int, paso: str) -> None:
        await db.exportaciones.update_one(
            {"_id": exp_id}, {"$set": {"progreso": pct, "paso": paso, "updated_at": ahora()}}
        )

    try:
        raiz = RAIZ / exp_id
        raiz.mkdir(parents=True, exist_ok=True)
        zip_ruta, manifiesto = await paquete.generar(
            pieza_id, raiz, alternativas=datos.alternativas, rutas=datos.rutas,
            carpeta_destino=datos.carpeta_destino, progreso=progreso,
        )
        await db.exportaciones.update_one(
            {"_id": exp_id},
            {"$set": {
                "estado": "lista", "progreso": 100, "paso": "Listo", "archivo": str(zip_ruta),
                "nombre_archivo": zip_ruta.name, "tamano_bytes": zip_ruta.stat().st_size,
                "avisos": manifiesto.get("avisos", []), "updated_at": ahora(),
            }},
        )
    except Exception as e:  # noqa: BLE001 — se muestra al usuario tal cual
        await db.exportaciones.update_one(
            {"_id": exp_id}, {"$set": {"estado": "fallida", "error": str(e), "updated_at": ahora()}}
        )


@router.post("/piezas/{pieza_id}/exportar", status_code=201)
async def exportar(pieza_id: str, datos: PedirExportacion):
    pieza = await db.piezas.find_one({"_id": pieza_id})
    if not pieza:
        raise HTTPException(404, "Pieza no encontrada")
    if datos.rutas == "absolutas" and not (datos.carpeta_destino or "").strip():
        raise HTTPException(422, "Con rutas absolutas hay que decir en qué carpeta se va a descomprimir.")
    en_marcha = await db.exportaciones.find_one({"pieza_id": pieza_id, "estado": "en_curso"})
    if en_marcha:
        raise HTTPException(409, "Ya se está exportando esta pieza: espera a que termine.")
    exp_id = nuevo_id()
    doc = {
        "_id": exp_id, "id": exp_id, "pieza_id": pieza_id, "proyecto_id": pieza["proyecto_id"],
        "estado": "en_curso", "progreso": 0, "paso": "En cola", "opciones": datos.model_dump(),
        "error": None, "avisos": [], "created_at": ahora(), "updated_at": ahora(),
    }
    await db.exportaciones.insert_one(doc)
    asyncio.create_task(_trabajar(exp_id, pieza_id, datos))
    return sin_id(doc)


@router.get("/exportaciones/{exp_id}")
async def ver_exportacion(exp_id: str):
    doc = await db.exportaciones.find_one({"_id": exp_id})
    if not doc:
        raise HTTPException(404, "Exportación no encontrada")
    doc = sin_id(doc)
    doc.pop("archivo", None)
    return doc


@router.get("/piezas/{pieza_id}/exportaciones")
async def exportaciones_de_pieza(pieza_id: str):
    docs = await db.exportaciones.find({"pieza_id": pieza_id}).sort("created_at", -1).to_list(50)
    salida = []
    for d in docs:
        d = sin_id(d)
        d.pop("archivo", None)
        salida.append(d)
    return salida


@router.get("/exportaciones/{exp_id}/archivo")
async def descargar(exp_id: str):
    doc = await db.exportaciones.find_one({"_id": exp_id})
    if not doc or doc.get("estado") != "lista" or not Path(doc.get("archivo") or "").exists():
        raise HTTPException(404, "El paquete no está disponible.")
    return FileResponse(doc["archivo"], media_type="application/zip", filename=doc["nombre_archivo"])


async def reparar_al_arrancar() -> None:
    """Una exportación que estaba en curso al reiniciar no va a terminar: se
    marca como fallida para que se pueda volver a pedir."""
    await db.exportaciones.update_many(
        {"estado": "en_curso"},
        {"$set": {"estado": "fallida", "error": "El estudio se reinició durante la exportación. Vuelve a exportar."}},
    )
