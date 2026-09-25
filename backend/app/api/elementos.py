"""Elementos y versiones de ficha (§3.1, §6.2).
Una FichaVersion aprobada es inmutable: editar = crear una versión nueva."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import (
    Elemento,
    ElementoCrear,
    ElementoEditar,
    FichaEditar,
    FichaVersion,
    ahora,
)

router = APIRouter(prefix="/api", tags=["elementos"])


async def _fichas_de(elemento_id: str) -> list[dict]:
    docs = await db.fichas.find({"elemento_id": elemento_id}).sort("version", 1).to_list(200)
    return [sin_id(d) for d in docs]


async def _con_fichas(elemento: dict) -> dict:
    fichas = await _fichas_de(elemento["id"])
    vigente = next((f for f in fichas if f["version"] == elemento["ficha_vigente"]), None)
    aprobadas = [f["version"] for f in fichas if f["estado"] == "aprobada"]
    return {
        **elemento,
        "fichas": fichas,
        "ficha": vigente,
        "ultima_aprobada": max(aprobadas) if aprobadas else None,
        "ultima_version": max((f["version"] for f in fichas), default=0),
    }


@router.get("/espacios/{espacio_id}/elementos")
async def listar_elementos(espacio_id: str, clase: str | None = None):
    filtro: dict = {"espacio_id": espacio_id}
    if clase:
        filtro["clase"] = clase
    docs = await db.elementos.find(filtro).sort("created_at", -1).to_list(2000)
    return [await _con_fichas(sin_id(d)) for d in docs]


@router.post("/espacios/{espacio_id}/elementos", status_code=201)
async def crear_elemento(espacio_id: str, datos: ElementoCrear):
    esp = await db.espacios.find_one({"_id": espacio_id})
    if not esp:
        raise HTTPException(404, "Espacio no encontrado")
    if not datos.nombre.strip():
        raise HTTPException(400, "El elemento necesita un nombre.")
    el = Elemento(espacio_id=espacio_id, clase=datos.clase, nombre=datos.nombre.strip())
    doc = el.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.elementos.insert_one(doc)

    ficha = FichaVersion(elemento_id=el.id, version=1)
    fdoc = ficha.model_dump(mode="json")
    fdoc["_id"] = fdoc["id"]
    await db.fichas.insert_one(fdoc)
    return await _con_fichas(sin_id(doc))


@router.get("/elementos/{elemento_id}")
async def obtener_elemento(elemento_id: str):
    doc = await db.elementos.find_one({"_id": elemento_id})
    if not doc:
        raise HTTPException(404, "Elemento no encontrado")
    return await _con_fichas(sin_id(doc))


@router.patch("/elementos/{elemento_id}")
async def editar_elemento(elemento_id: str, datos: ElementoEditar):
    doc = await db.elementos.find_one({"_id": elemento_id})
    if not doc:
        raise HTTPException(404, "Elemento no encontrado")
    if doc["updated_at"] != datos.updated_at:
        raise HTTPException(409, "El elemento se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {k: v for k, v in datos.model_dump(exclude={"updated_at"}).items() if v is not None}
    if "nombre" in cambios:
        cambios["nombre"] = cambios["nombre"].strip()
        if not cambios["nombre"]:
            raise HTTPException(400, "El elemento necesita un nombre.")
    cambios["updated_at"] = ahora()
    await db.elementos.update_one({"_id": elemento_id}, {"$set": cambios})
    doc = await db.elementos.find_one({"_id": elemento_id})
    return await _con_fichas(sin_id(doc))


@router.delete("/elementos/{elemento_id}", status_code=200)
async def borrar_elemento(elemento_id: str):
    doc = await db.elementos.find_one({"_id": elemento_id})
    if not doc:
        raise HTTPException(404, "Elemento no encontrado")
    usos = await db.reparto.find({"elemento_id": elemento_id}).to_list(500)
    if usos:
        ids = list({u["proyecto_id"] for u in usos})
        proyectos = await db.proyectos.find({"_id": {"$in": ids}}).to_list(500)
        nombres = ", ".join(p["nombre"] for p in proyectos)
        raise HTTPException(409, f"No se puede borrar: está en el reparto de {nombres}.")
    await db.fichas.delete_many({"elemento_id": elemento_id})
    await db.elementos.delete_one({"_id": elemento_id})
    return {"ok": True}


# --- Versiones de ficha ---


@router.post("/elementos/{elemento_id}/fichas", status_code=201)
async def crear_version(elemento_id: str):
    el = await db.elementos.find_one({"_id": elemento_id})
    if not el:
        raise HTTPException(404, "Elemento no encontrado")
    fichas = await db.fichas.find({"elemento_id": elemento_id}).sort("version", -1).to_list(200)
    borrador = next((f for f in fichas if f["estado"] == "borrador"), None)
    if borrador:
        raise HTTPException(409, f"Ya hay una versión en borrador (v{borrador['version']}). Termínala o apruébala.")
    ultima = fichas[0] if fichas else None
    nueva = FichaVersion(
        elemento_id=elemento_id,
        version=(ultima["version"] + 1) if ultima else 1,
        descripcion=(ultima or {}).get("descripcion"),
        rasgos_fijos=(ultima or {}).get("rasgos_fijos", []),
        rasgos_variables=(ultima or {}).get("rasgos_variables", []),
        referencias=(ultima or {}).get("referencias", []),
        personalidad=(ultima or {}).get("personalidad"),
        voz=(ultima or {}).get("voz"),
        materiales_colores=(ultima or {}).get("materiales_colores"),
        ambiente=(ultima or {}).get("ambiente"),
        distribucion=(ultima or {}).get("distribucion"),
    )
    doc = nueva.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.fichas.insert_one(doc)
    return sin_id(doc)


@router.patch("/fichas/{ficha_id}")
async def editar_ficha(ficha_id: str, datos: FichaEditar):
    doc = await db.fichas.find_one({"_id": ficha_id})
    if not doc:
        raise HTTPException(404, "Ficha no encontrada")
    if doc["estado"] == "aprobada":
        raise HTTPException(409, "Una versión aprobada no se edita. Crea una versión nueva.")
    if doc["updated_at"] != datos.updated_at:
        raise HTTPException(409, "La ficha se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {
        k: v for k, v in datos.model_dump(mode="json", exclude={"updated_at"}).items() if v is not None
    }
    cambios["updated_at"] = ahora()
    await db.fichas.update_one({"_id": ficha_id}, {"$set": cambios})
    doc = await db.fichas.find_one({"_id": ficha_id})
    return sin_id(doc)


@router.post("/fichas/{ficha_id}/aprobar")
async def aprobar_ficha(ficha_id: str):
    doc = await db.fichas.find_one({"_id": ficha_id})
    if not doc:
        raise HTTPException(404, "Ficha no encontrada")
    if doc["estado"] == "aprobada":
        return sin_id(doc)
    if not (doc.get("descripcion") or "").strip():
        raise HTTPException(400, "La ficha necesita una descripción para poder aprobarla.")
    momento = ahora()
    await db.fichas.update_one(
        {"_id": ficha_id},
        {"$set": {"estado": "aprobada", "aprobada_en": momento, "updated_at": momento}},
    )
    await db.elementos.update_one(
        {"_id": doc["elemento_id"]},
        {"$set": {"ficha_vigente": doc["version"], "updated_at": momento}},
    )
    doc = await db.fichas.find_one({"_id": ficha_id})
    return sin_id(doc)
