"""Reparto (§3.1): elementos del espacio traídos a un proyecto con su versión
de ficha FIJADA. No sigue automáticamente a la versión vigente."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import Reparto, RepartoCrear, RepartoEditar, ahora

router = APIRouter(prefix="/api", tags=["reparto"])


async def _enriquecer(entrada: dict) -> dict:
    el = await db.elementos.find_one({"_id": entrada["elemento_id"]})
    if not el:
        return {**entrada, "elemento": None, "ficha": None, "hay_version_nueva": None}
    fichas = await db.fichas.find({"elemento_id": el["_id"]}).sort("version", 1).to_list(200)
    fijada = next((f for f in fichas if f["version"] == entrada["version_ficha"]), None)
    aprobadas = [f["version"] for f in fichas if f["estado"] == "aprobada"]
    ultima_aprobada = max(aprobadas) if aprobadas else None
    hay_nueva = (
        ultima_aprobada if ultima_aprobada and ultima_aprobada > entrada["version_ficha"] else None
    )
    return {
        **entrada,
        "elemento": sin_id(el),
        "ficha": sin_id(fijada) if fijada else None,
        "fichas": [sin_id(f) for f in fichas],
        "ultima_aprobada": ultima_aprobada,
        "hay_version_nueva": hay_nueva,
    }


async def entradas_reparto(proyecto_id: str, clase: str | None = None) -> list[dict]:
    docs = await db.reparto.find({"proyecto_id": proyecto_id}).sort("created_at", 1).to_list(1000)
    salida = [await _enriquecer(sin_id(d)) for d in docs]
    if clase:
        salida = [e for e in salida if e["elemento"] and e["elemento"]["clase"] == clase]
    return salida


@router.get("/proyectos/{proyecto_id}/reparto")
async def listar_reparto(proyecto_id: str, clase: str | None = None):
    return await entradas_reparto(proyecto_id, clase)


@router.post("/proyectos/{proyecto_id}/reparto", status_code=201)
async def anadir_al_reparto(proyecto_id: str, datos: RepartoCrear):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    el = await db.elementos.find_one({"_id": datos.elemento_id})
    if not el:
        raise HTTPException(404, "Elemento no encontrado")
    if el["espacio_id"] != proy["espacio_id"]:
        raise HTTPException(409, "Ese elemento es de otro espacio.")
    ya = await db.reparto.find_one({"proyecto_id": proyecto_id, "elemento_id": datos.elemento_id})
    if ya:
        raise HTTPException(409, "Ese elemento ya está en el reparto.")
    entrada = Reparto(
        proyecto_id=proyecto_id,
        elemento_id=datos.elemento_id,
        version_ficha=el["ficha_vigente"],
        papel=datos.papel,
    )
    doc = entrada.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.reparto.insert_one(doc)
    return await _enriquecer(sin_id(doc))


@router.patch("/proyectos/{proyecto_id}/reparto/{entrada_id}")
async def editar_entrada(proyecto_id: str, entrada_id: str, datos: RepartoEditar):
    doc = await db.reparto.find_one({"_id": entrada_id, "proyecto_id": proyecto_id})
    if not doc:
        raise HTTPException(404, "Entrada del reparto no encontrada")
    cambios = {k: v for k, v in datos.model_dump().items() if v is not None}
    if "version_ficha" in cambios:
        ficha = await db.fichas.find_one(
            {"elemento_id": doc["elemento_id"], "version": cambios["version_ficha"]}
        )
        if not ficha:
            raise HTTPException(404, "Esa versión de ficha no existe.")
        if ficha["estado"] != "aprobada":
            raise HTTPException(409, "Solo se puede fijar una versión aprobada.")
    cambios["updated_at"] = ahora()
    await db.reparto.update_one({"_id": entrada_id}, {"$set": cambios})
    doc = await db.reparto.find_one({"_id": entrada_id})
    return await _enriquecer(sin_id(doc))


@router.delete("/proyectos/{proyecto_id}/reparto/{entrada_id}", status_code=200)
async def quitar_del_reparto(proyecto_id: str, entrada_id: str):
    doc = await db.reparto.find_one({"_id": entrada_id, "proyecto_id": proyecto_id})
    if not doc:
        raise HTTPException(404, "Entrada del reparto no encontrada")
    await db.reparto.delete_one({"_id": entrada_id})
    return {"ok": True}
