from __future__ import annotations

from fastapi import APIRouter

from app.db import db, sin_id
from app.dominio import recorridos

router = APIRouter(prefix="/api", tags=["estudio"])


@router.get("/recorridos")
async def listar_recorridos():
    return recorridos.tipos_resumen()


@router.get("/estudio")
async def estudio():
    """Datos de la Apertura del estudio (P1, §5.1)."""
    espacios_docs = await db.espacios.find({"archivado": {"$ne": True}}).sort("created_at", -1).to_list(1000)
    espacios = []
    mapa_espacio = {}
    for d in espacios_docs:
        e = sin_id(d)
        mapa_espacio[e["id"]] = e
        proyectos = await db.proyectos.find({"espacio_id": e["id"]}).to_list(1000)
        en_curso = sum(1 for p in proyectos if recorridos.calcular(p)["paso_actual"] is not None)
        espacios.append({**e, "num_proyectos": len(proyectos), "num_en_curso": en_curso})

    todos = await db.proyectos.find().sort("ultimo_acceso", -1).to_list(1000)
    tarjetas = []
    for p in todos:
        p = sin_id(p)
        esp = mapa_espacio.get(p["espacio_id"])
        estado = recorridos.calcular(p)
        clave_actual = estado["paso_actual"]
        falta = None
        if clave_actual:
            paso = next((x for x in estado["pasos"] if x["clave"] == clave_actual), None)
            falta = paso["listo_cuando"] if paso else None
        tarjetas.append(
            {
                "proyecto_id": p["id"],
                "proyecto_nombre": p["nombre"],
                "tipo": p["tipo"],
                "espacio_id": p["espacio_id"],
                "espacio_nombre": esp["nombre"] if esp else "",
                "progreso": estado["progreso"],
                "paso_actual": clave_actual,
                "falta": falta,
                "ultima_ubicacion": p.get("ultima_ubicacion"),
            }
        )

    retomar = tarjetas[0] if tarjetas else None
    recientes = tarjetas[1:4]
    return {"retomar": retomar, "recientes": recientes, "espacios": espacios}
