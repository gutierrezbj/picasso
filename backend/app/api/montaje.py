"""Montaje de una pieza (§11.2). Calcula la línea de tiempo a partir de lo que ya
está decidido: el orden del guion aprobado, la toma elegida de cada plano, las
voces colocadas en su plano y las pistas de música y ambiente. No guarda nada
propio: el montaje se deriva, no se edita a mano.
"""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException

from app.api import voces as voces_api
from app.api.pistas import pistas_de_pieza
from app.db import db, sin_id

router = APIRouter(prefix="/api", tags=["montaje"])

# Un plano sin toma ni duración ocupa este hueco en la tira, para verse.
DURACION_HUECO_S = 3.0


async def _toma_elegida(plano: dict[str, Any]) -> Optional[dict[str, Any]]:
    if not plano.get("toma_elegida_id"):
        return None
    toma = await db.tomas.find_one({"_id": plano["toma_elegida_id"]})
    if not toma:
        return None
    medio = await db.medios.find_one({"_id": toma["medio_id"]})
    return {
        "id": toma["_id"],
        "numero": toma.get("numero"),
        "medio_id": toma["medio_id"],
        "clase": (medio or {}).get("clase"),
        "duracion_s": (medio or {}).get("duracion_s"),
        "revision_guion": toma.get("revision_guion"),
    }


async def linea_de_tiempo(pieza_id: str) -> dict[str, Any]:
    pieza = await db.piezas.find_one({"_id": pieza_id})
    if not pieza:
        raise HTTPException(404, "Pieza no encontrada")
    proy = sin_id(await db.proyectos.find_one({"_id": pieza["proyecto_id"]}))
    guion = await db.guiones.find_one({"pieza_id": pieza_id})
    if not guion or not guion.get("revision"):
        raise HTTPException(409, "El montaje se abre con el guion aprobado.")

    escenas = await db.escenas.find(
        {"guion_id": guion["_id"], "borrador": False}
    ).sort("orden", 1).to_list(500)

    planos: list[dict[str, Any]] = []
    voces: list[dict[str, Any]] = []
    avisos: list[str] = []
    reloj = 0.0
    for n, e in enumerate(escenas, start=1):
        escena = sin_id(e)
        docs = await voces_api.planos_de_escena(escena["id"])
        inicio_plano: dict[str, float] = {}
        duracion_plano: dict[str, float] = {}
        for p in docs:
            etiqueta = f"E{n}·P{p['orden'] + 1}"
            toma = await _toma_elegida(p)
            if toma and toma["clase"] == "video" and toma["duracion_s"]:
                duracion, fuente = float(toma["duracion_s"]), "toma"
            elif p.get("duracion_s"):
                duracion, fuente = float(p["duracion_s"]), "plano"
            else:
                duracion, fuente = DURACION_HUECO_S, "defecto"
            if not toma:
                avisos.append(f"{etiqueta} no tiene toma elegida: sale como hueco.")
            inicio_plano[p["id"]] = reloj
            duracion_plano[p["id"]] = duracion
            planos.append(
                {
                    "plano_id": p["id"],
                    "etiqueta": etiqueta,
                    "escena_id": escena["id"],
                    "escena_titulo": escena.get("titulo") or f"Escena {n}",
                    "modalidad": p.get("modalidad"),
                    "descripcion": (p.get("direccion") or {}).get("que_se_muestra") or p.get("descripcion"),
                    "inicio_s": round(reloj, 3),
                    "duracion_s": round(duracion, 3),
                    "fuente_duracion": fuente,
                    "toma": toma,
                }
            )
            reloj += duracion

        for d in escena.get("dialogos") or []:
            if not d.get("id"):
                continue
            vista = await voces_api.vista_voz(escena, d, docs)
            elegida = next((t for t in vista["tomas"] if t["id"] == vista["toma_elegida_id"]), None)
            etiqueta_plano = next((x["etiqueta"] for x in planos if x["plano_id"] == vista["plano_id"]), None)
            if not elegida:
                avisos.append(
                    f"La voz de {vista['hablante_nombre']} («{vista['texto'][:30]}») no tiene toma elegida."
                )
                continue
            if vista["plano_id"] not in inicio_plano:
                continue
            for a in vista["avisos"]:
                avisos.append(f"{etiqueta_plano} · {vista['hablante_nombre']}: {a}")
            voces.append(
                {
                    "dialogo_id": vista["dialogo_id"],
                    "plano_id": vista["plano_id"],
                    "etiqueta_plano": etiqueta_plano,
                    "hablante": vista["hablante"],
                    "hablante_nombre": vista["hablante_nombre"],
                    "texto": vista["texto"],
                    "desfase_s": vista["desfase_s"],
                    "inicio_s": round(inicio_plano[vista["plano_id"]] + vista["desfase_s"], 3),
                    "duracion_s": elegida["duracion_s"],
                    "toma_id": elegida["id"],
                    "medio_id": elegida["medio_id"],
                    "desactualizada": vista["desactualizada"],
                }
            )

    pistas = await pistas_de_pieza(pieza_id)
    for p in pistas:
        if p.get("duracion_s") and p["inicio_s"] >= reloj > 0:
            avisos.append(f"La pista «{p['nombre']}» empieza después de que acabe la pieza.")

    sin_dialogo = (await voces_api.voces_de_pieza(pieza_id))["sin_dialogo"]
    if sin_dialogo:
        avisos.append(f"Hay {len(sin_dialogo)} voz(es) cuyo diálogo ya no está en el guion: no entran en el montaje.")
    huerfanos = await db.planos.count_documents(
        {"pieza_id": pieza_id, "escena_id": {"$nin": [e["_id"] for e in escenas]}}
    )
    if huerfanos:
        avisos.append(f"Hay {huerfanos} plano(s) sin escena: no entran en el montaje hasta que tengan escena.")

    return {
        "pieza": sin_id(pieza),
        "proyecto": {
            "id": proy["id"],
            "nombre": proy["nombre"],
            "tipo": proy["tipo"],
            "formato_video": proy.get("formato_video"),
            "fps": proy.get("fps") or 25,
            "updated_at": proy["updated_at"],
        },
        "revision_guion": guion["revision"],
        "planos": planos,
        "voces": voces,
        "pistas": pistas,
        "duracion_total_s": round(reloj, 3),
        "avisos": avisos,
    }


@router.get("/piezas/{pieza_id}/montaje")
async def montaje(pieza_id: str):
    return await linea_de_tiempo(pieza_id)
