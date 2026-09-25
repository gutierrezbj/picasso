from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio import recorridos
from app.dominio.estado import completado_de
from app.dominio.modelos import (
    Proyecto,
    ProyectoCrear,
    ProyectoEditar,
    Ubicacion,
    ahora,
)

router = APIRouter(prefix="/api", tags=["proyectos"])


async def _resumen_proyecto(p: dict) -> dict:
    estado = recorridos.calcular(p, await completado_de(db, p))
    return {
        **p,
        "paso_actual": estado["paso_actual"],
        "progreso": estado["progreso"],
        "nombre_recorrido": estado["nombre_recorrido"],
    }


async def _moneda() -> str:
    aj = await db.ajustes.find_one({"_id": "global"})
    return aj["moneda"] if aj else "USD"


@router.get("/espacios/{espacio_id}/proyectos")
async def listar_proyectos(espacio_id: str):
    docs = await db.proyectos.find({"espacio_id": espacio_id}).sort("ultimo_acceso", -1).to_list(1000)
    return [await _resumen_proyecto(sin_id(d)) for d in docs]


@router.post("/espacios/{espacio_id}/proyectos", status_code=201)
async def crear_proyecto(espacio_id: str, datos: ProyectoCrear):
    esp = await db.espacios.find_one({"_id": espacio_id})
    if not esp:
        raise HTTPException(404, "Espacio no encontrado")
    proy = Proyecto(espacio_id=espacio_id, **datos.model_dump())
    doc = proy.model_dump(mode="json")
    doc["ultima_ubicacion"] = recorridos.ubicacion_por_defecto(doc)
    doc["_id"] = doc["id"]
    await db.proyectos.insert_one(doc)
    return await _resumen_proyecto(sin_id(doc))


@router.get("/proyectos/{proyecto_id}")
async def obtener_proyecto(proyecto_id: str):
    doc = await db.proyectos.find_one({"_id": proyecto_id})
    if not doc:
        raise HTTPException(404, "Proyecto no encontrado")
    p = sin_id(doc)
    esp = await db.espacios.find_one({"_id": p["espacio_id"]})
    estado = recorridos.calcular(p, await completado_de(db, p))
    return {
        "proyecto": p,
        "espacio": sin_id(esp) if esp else None,
        "recorrido": estado,
        "gasto": 0.0,
        "moneda": await _moneda(),
    }


@router.patch("/proyectos/{proyecto_id}")
async def editar_proyecto(proyecto_id: str, datos: ProyectoEditar):
    doc = await db.proyectos.find_one({"_id": proyecto_id})
    if not doc:
        raise HTTPException(404, "Proyecto no encontrado")
    if doc["updated_at"] != datos.updated_at:
        raise HTTPException(409, "El proyecto se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {k: v for k, v in datos.model_dump(exclude={"updated_at"}).items() if v is not None}
    cambios["updated_at"] = ahora()
    await db.proyectos.update_one({"_id": proyecto_id}, {"$set": cambios})
    doc = await db.proyectos.find_one({"_id": proyecto_id})
    return await _resumen_proyecto(sin_id(doc))


@router.post("/proyectos/{proyecto_id}/ubicacion")
async def guardar_ubicacion(proyecto_id: str, datos: Ubicacion):
    doc = await db.proyectos.find_one({"_id": proyecto_id})
    if not doc:
        raise HTTPException(404, "Proyecto no encontrado")
    await db.proyectos.update_one(
        {"_id": proyecto_id},
        {"$set": {"ultima_ubicacion": datos.ultima_ubicacion, "ultimo_acceso": ahora()}},
    )
    return {"ok": True}


@router.delete("/proyectos/{proyecto_id}", status_code=204)
async def borrar_proyecto(proyecto_id: str):
    await db.reparto.delete_many({"proyecto_id": proyecto_id})
    await db.desarrollos.delete_one({"_id": proyecto_id})
    await db.propuestas.delete_many({"proyecto_id": proyecto_id})
    await db.proyectos.delete_one({"_id": proyecto_id})
    return None
