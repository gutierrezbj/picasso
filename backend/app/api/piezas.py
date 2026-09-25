"""Piezas y capítulos (§3.1, §4.1 serie). Corto, anuncio e imagen tienen una
pieza; una serie tiene una por capítulo."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import Guion, Pieza, PiezaCrear, PiezaEditar, ahora

router = APIRouter(prefix="/api", tags=["piezas"])


async def _crear_guion(pieza_id: str, tipo_proyecto: str) -> dict:
    guion = Guion(pieza_id=pieza_id, clase="encargo" if tipo_proyecto == "imagen" else "escenas")
    doc = guion.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.guiones.insert_one(doc)
    return doc


async def _nueva_pieza(proyecto: dict, datos: PiezaCrear) -> dict:
    pieza = Pieza(
        proyecto_id=proyecto["id"],
        numero=datos.numero,
        titulo=datos.titulo,
        de_que_va=datos.de_que_va,
    )
    doc = pieza.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.piezas.insert_one(doc)
    await _crear_guion(pieza.id, proyecto["tipo"])
    return sin_id(doc)


async def _resumen(pieza: dict) -> dict:
    guion = sin_id(await db.guiones.find_one({"pieza_id": pieza["id"]}))
    num = await db.escenas.count_documents({"guion_id": guion["id"], "borrador": False})
    if not num:
        num = await db.escenas.count_documents({"guion_id": guion["id"], "borrador": True})
    return {
        **pieza,
        "guion_id": guion["id"],
        "guion_estado": guion["estado"],
        "guion_revision": guion["revision"],
        "revision_en_curso": guion.get("revision_en_curso") is not None,
        "num_escenas": num,
    }


async def piezas_de(proyecto: dict) -> list[dict]:
    """Devuelve las piezas. Para los tipos de una sola pieza la crea si no existe:
    es un contenedor, no contenido (§0.5 «nada se crea automáticamente» se refiere
    a idea, guion, personajes, escenas y material)."""
    docs = await db.piezas.find({"proyecto_id": proyecto["id"]}).sort("numero", 1).to_list(500)
    if not docs and proyecto["tipo"] != "serie":
        docs = [await _nueva_pieza(proyecto, PiezaCrear())]
    return [await _resumen(sin_id(d)) for d in docs]


@router.get("/proyectos/{proyecto_id}/piezas")
async def listar_piezas(proyecto_id: str):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    return await piezas_de(sin_id(proy))


@router.post("/proyectos/{proyecto_id}/piezas", status_code=201)
async def crear_pieza(proyecto_id: str, datos: PiezaCrear):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    if proy["tipo"] != "serie":
        existentes = await db.piezas.count_documents({"proyecto_id": proyecto_id})
        if existentes:
            raise HTTPException(409, "Este tipo de proyecto tiene una sola pieza.")
    if datos.numero is None:
        ultima = await db.piezas.find({"proyecto_id": proyecto_id}).sort("numero", -1).to_list(1)
        datos.numero = ((ultima[0].get("numero") or 0) + 1) if ultima else 1
    doc = await _nueva_pieza(sin_id(proy), datos)
    return await _resumen(doc)


@router.patch("/piezas/{pieza_id}")
async def editar_pieza(pieza_id: str, datos: PiezaEditar):
    doc = await db.piezas.find_one({"_id": pieza_id})
    if not doc:
        raise HTTPException(404, "Pieza no encontrada")
    if doc["updated_at"] != datos.updated_at:
        raise HTTPException(409, "La pieza se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {k: v for k, v in datos.model_dump(exclude={"updated_at"}).items() if v is not None}
    cambios["updated_at"] = ahora()
    await db.piezas.update_one({"_id": pieza_id}, {"$set": cambios})
    doc = await db.piezas.find_one({"_id": pieza_id})
    return await _resumen(sin_id(doc))


@router.delete("/piezas/{pieza_id}", status_code=200)
async def borrar_pieza(pieza_id: str):
    doc = await db.piezas.find_one({"_id": pieza_id})
    if not doc:
        raise HTTPException(404, "Pieza no encontrada")
    proy = await db.proyectos.find_one({"_id": doc["proyecto_id"]})
    if proy and proy["tipo"] != "serie":
        raise HTTPException(409, "Este tipo de proyecto tiene una sola pieza y no se borra.")
    guion = await db.guiones.find_one({"pieza_id": pieza_id})
    if guion:
        gid = sin_id(guion)["id"]
        await db.escenas.delete_many({"guion_id": gid})
        await db.guiones.delete_one({"_id": gid})
    await db.planos.delete_many({"pieza_id": pieza_id})
    await db.piezas.delete_one({"_id": pieza_id})
    return {"ok": True}
