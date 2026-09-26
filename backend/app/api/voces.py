"""Voces por diálogo (§3.1 «Voz», §11.1).

Cada diálogo del guion aprobado tiene su voz: tomas de voz propias (no compiten
con las tomas del plano), una elegida, el plano donde suena y un desfase desde el
inicio de ese plano. La voz se ata al `id` estable del diálogo, que sobrevive a
las revisiones del guion.
"""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import VozDialogo, VozDialogoEditar, ahora, nuevo_id

router = APIRouter(prefix="/api", tags=["voces"])


async def asegurar_ids_dialogos() -> int:
    """Da `id` a los diálogos que no lo tienen (datos anteriores a la Fase 7).
    Las copias de trabajo heredan el id del diálogo en la misma posición de su
    escena aprobada, para que la voz siga siendo la misma."""
    arreglados = 0
    aprobadas = await db.escenas.find({"borrador": False}).to_list(5000)
    for e in aprobadas:
        dialogos = e.get("dialogos") or []
        if all(d.get("id") for d in dialogos):
            continue
        nuevos = [{**d, "id": d.get("id") or nuevo_id()} for d in dialogos]
        await db.escenas.update_one({"_id": e["_id"]}, {"$set": {"dialogos": nuevos}})
        arreglados += 1
    copias = await db.escenas.find({"borrador": True}).to_list(5000)
    for e in copias:
        dialogos = e.get("dialogos") or []
        if all(d.get("id") for d in dialogos):
            continue
        origen = await db.escenas.find_one({"_id": e.get("origen_id")}) if e.get("origen_id") else None
        ids_origen = [d.get("id") for d in (origen or {}).get("dialogos") or []]
        nuevos = []
        for i, d in enumerate(dialogos):
            heredado = ids_origen[i] if i < len(ids_origen) else None
            nuevos.append({**d, "id": d.get("id") or heredado or nuevo_id()})
        await db.escenas.update_one({"_id": e["_id"]}, {"$set": {"dialogos": nuevos}})
        arreglados += 1
    return arreglados


async def escena_de_dialogo(dialogo_id: str) -> Optional[dict[str, Any]]:
    """La escena **aprobada** que contiene el diálogo (las voces solo existen
    para el guion aprobado)."""
    doc = await db.escenas.find_one({"borrador": False, "dialogos.id": dialogo_id})
    return sin_id(doc) if doc else None


async def planos_de_escena(escena_id: str) -> list[dict[str, Any]]:
    docs = await db.planos.find({"escena_id": escena_id}).sort("orden", 1).to_list(500)
    return [sin_id(d) for d in docs]


async def _nombre_hablante(hablante: str) -> str:
    if hablante == "narrador":
        return "Narrador"
    entrada = await db.reparto.find_one({"_id": hablante})
    elemento = await db.elementos.find_one({"_id": (entrada or {}).get("elemento_id") or hablante})
    return (elemento or {}).get("nombre") or "?"


async def _duracion_medio(medio_id: Optional[str]) -> Optional[float]:
    if not medio_id:
        return None
    medio = await db.medios.find_one({"_id": medio_id})
    return (medio or {}).get("duracion_s")


async def vista_voz(escena: dict[str, Any], dialogo: dict[str, Any], planos: list[dict[str, Any]]) -> dict[str, Any]:
    guardada = await db.voces.find_one({"_id": dialogo["id"]})
    voz = sin_id(guardada) if guardada else None
    plano_id = (voz or {}).get("plano_id") or (planos[0]["id"] if planos else None)
    plano = next((p for p in planos if p["id"] == plano_id), None)
    desfase = float((voz or {}).get("desfase_s") or 0)

    docs = await db.tomas.find({"dialogo_id": dialogo["id"]}).sort("numero", 1).to_list(200)
    tomas = []
    for t in docs:
        toma = sin_id(t)
        toma["duracion_s"] = await _duracion_medio(toma.get("medio_id"))
        toma["texto_actual"] = toma.get("texto_usado") == dialogo.get("texto")
        tomas.append(toma)
    elegida = next((t for t in tomas if t["id"] == (voz or {}).get("toma_elegida_id")), None)

    avisos: list[str] = []
    if elegida and not elegida["texto_actual"]:
        avisos.append("La voz elegida se produjo con otro texto: el diálogo ha cambiado.")
    duracion_plano = (plano or {}).get("duracion_s")
    if elegida and elegida["duracion_s"] and duracion_plano:
        sobra = round(desfase + elegida["duracion_s"] - float(duracion_plano), 2)
        if sobra > 0.04:
            avisos.append(
                f"La voz dura {str(sobra).replace('.', ',')} s más de lo que queda del plano. "
                "Alarga el plano, muévela a otro plano o cambia el desfase."
            )
    if not planos:
        avisos.append("La escena aún no tiene planos: la voz no tiene dónde sonar.")

    return {
        "dialogo_id": dialogo["id"],
        "escena_id": escena["id"],
        "hablante": dialogo["hablante"],
        "hablante_nombre": await _nombre_hablante(dialogo["hablante"]),
        "texto": dialogo.get("texto") or "",
        "plano_id": plano_id,
        "desfase_s": desfase,
        "toma_elegida_id": (voz or {}).get("toma_elegida_id"),
        "tomas": tomas,
        "desactualizada": bool(elegida and not elegida["texto_actual"]),
        "avisos": avisos,
        "updated_at": (voz or {}).get("updated_at"),
    }


@router.get("/escenas/{escena_id}/voces")
async def voces_de_escena(escena_id: str):
    """Las voces de la escena y sus planos (para elegir dónde suena cada una)."""
    doc = await db.escenas.find_one({"_id": escena_id, "borrador": False})
    if not doc:
        raise HTTPException(404, "Escena del guion aprobado no encontrada")
    escena = sin_id(doc)
    planos = await planos_de_escena(escena_id)
    hermanas = await db.escenas.find(
        {"guion_id": escena["guion_id"], "borrador": False}
    ).sort("orden", 1).to_list(500)
    n = next((i for i, e in enumerate(hermanas) if e["_id"] == escena_id), 0) + 1
    return {
        "planos": [
            {"id": p["id"], "etiqueta": f"E{n}·P{p['orden'] + 1}", "duracion_s": p.get("duracion_s")}
            for p in planos
        ],
        "voces": [await vista_voz(escena, d, planos) for d in escena.get("dialogos") or [] if d.get("id")],
    }


@router.get("/piezas/{pieza_id}/voces")
async def voces_de_pieza(pieza_id: str):
    """Todas las voces de la pieza en orden de guion, más las voces cuyo diálogo
    ya no está en el guion aprobado («voces sin diálogo», §3.1)."""
    guion = await db.guiones.find_one({"pieza_id": pieza_id})
    if not guion:
        raise HTTPException(404, "Guion no encontrado")
    escenas = await db.escenas.find({"guion_id": guion["_id"], "borrador": False}).sort("orden", 1).to_list(500)
    vistas: list[dict[str, Any]] = []
    vivos: set[str] = set()
    for e in escenas:
        escena = sin_id(e)
        planos = await planos_de_escena(escena["id"])
        for d in escena.get("dialogos") or []:
            if d.get("id"):
                vivos.add(d["id"])
                vistas.append(await vista_voz(escena, d, planos))
    huerfanas = await db.voces.find(
        {"_id": {"$nin": list(vivos)}, "pieza_id": pieza_id}
    ).to_list(500)
    sin_dialogo = [sin_id(v) for v in huerfanas]
    return {"voces": vistas, "sin_dialogo": sin_dialogo}


@router.patch("/voces/{dialogo_id}")
async def editar_voz(dialogo_id: str, datos: VozDialogoEditar):
    escena = await escena_de_dialogo(dialogo_id)
    if not escena:
        raise HTTPException(404, "Ese diálogo no está en el guion aprobado.")
    planos = await planos_de_escena(escena["id"])
    cambios: dict[str, Any] = {}
    if datos.plano_id is not None:
        if datos.plano_id not in {p["id"] for p in planos}:
            raise HTTPException(409, "La voz solo puede sonar en un plano de su escena.")
        cambios["plano_id"] = datos.plano_id
    if datos.desfase_s is not None:
        cambios["desfase_s"] = datos.desfase_s
    await guardar_voz(dialogo_id, escena, cambios)
    dialogo = next(d for d in escena["dialogos"] if d.get("id") == dialogo_id)
    return await vista_voz(escena, dialogo, planos)


async def guardar_voz(dialogo_id: str, escena: dict[str, Any], cambios: dict[str, Any]) -> None:
    """Crea la voz si no existe y aplica los cambios."""
    guion = await db.guiones.find_one({"_id": escena["guion_id"]})
    existente = await db.voces.find_one({"_id": dialogo_id})
    if not existente:
        voz = VozDialogo(id=dialogo_id, escena_id=escena["id"]).model_dump(mode="json")
        voz["_id"] = dialogo_id
        voz["pieza_id"] = (guion or {}).get("pieza_id")
        await db.voces.insert_one(voz)
    await db.voces.update_one(
        {"_id": dialogo_id},
        {"$set": {**cambios, "escena_id": escena["id"], "updated_at": ahora()}},
    )
