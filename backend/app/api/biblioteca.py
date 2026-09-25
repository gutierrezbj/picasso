"""Biblioteca del espacio (P3, §5). Todos los elementos y medios del espacio,
para consultar y ordenar fuera de un proyecto. Nunca material de otros espacios."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id

router = APIRouter(prefix="/api", tags=["biblioteca"])


@router.get("/espacios/{espacio_id}/biblioteca")
async def biblioteca(espacio_id: str):
    esp = await db.espacios.find_one({"_id": espacio_id})
    if not esp:
        raise HTTPException(404, "Espacio no encontrado")

    proyectos = await db.proyectos.find({"espacio_id": espacio_id}).to_list(1000)
    nombre_proyecto = {p["_id"]: p["nombre"] for p in proyectos}
    entradas = await db.reparto.find({"proyecto_id": {"$in": list(nombre_proyecto)}}).to_list(5000)

    usos_elemento: dict[str, list[str]] = {}
    for e in entradas:
        usos_elemento.setdefault(e["elemento_id"], []).append(nombre_proyecto[e["proyecto_id"]])

    elementos_docs = await db.elementos.find({"espacio_id": espacio_id}).sort("nombre", 1).to_list(2000)
    elementos = []
    usos_medio: dict[str, list[str]] = {}
    for d in elementos_docs:
        el = sin_id(d)
        fichas = await db.fichas.find({"elemento_id": el["id"]}).sort("version", 1).to_list(200)
        vigente = next((f for f in fichas if f["version"] == el["ficha_vigente"]), None)
        for f in fichas:
            for r in f.get("referencias", []):
                usos_medio.setdefault(r["medio_id"], []).append(el["nombre"])
        elementos.append(
            {
                **el,
                "ficha": sin_id(vigente) if vigente else None,
                "num_versiones": len(fichas),
                "proyectos": sorted(set(usos_elemento.get(el["id"], []))),
            }
        )

    medios_docs = await db.medios.find({"espacio_id": espacio_id}).sort("created_at", -1).to_list(2000)
    medios = [{**sin_id(d), "usado_en": sorted(set(usos_medio.get(d["_id"], [])))} for d in medios_docs]

    return {"espacio": sin_id(esp), "elementos": elementos, "medios": medios}
