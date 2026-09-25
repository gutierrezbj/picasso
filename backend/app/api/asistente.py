from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.formatos import formato_generico
from app.db import db, sin_id
from app.dominio.modelos import AceptarParte, PeticionAsistente
from app.asistente import proveedor as prov

router = APIRouter(prefix="/api", tags=["asistente"])


async def _modelo() -> str:
    aj = await db.ajustes.find_one({"_id": "global"})
    return (aj or {}).get("modelo_asistente", "simulado")


@router.get("/asistente/estado")
async def estado():
    modelo = await _modelo()
    p, motivo = prov.proveedor_actual(modelo)
    return {"disponible": p is not None, "motivo": motivo, "modelo": modelo}


async def _contexto(proyecto: dict) -> dict:
    des = await db.desarrollos.find_one({"_id": proyecto["id"]})
    fmt = formato_generico(proyecto["tipo"])
    return {
        "tipo": proyecto["tipo"],
        "desarrollo": sin_id(des) if des else {},
        "formato": fmt,
        "campos": list(prov.CAMPOS_VALIDOS),
    }


@router.post("/proyectos/{proyecto_id}/asistente/{tarea}")
async def proponer(proyecto_id: str, tarea: str, datos: PeticionAsistente):
    if tarea not in prov.TAREAS:
        raise HTTPException(400, "Tarea no válida")
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    modelo = await _modelo()
    proveedor, motivo = prov.proveedor_actual(modelo)
    if proveedor is None:
        raise HTTPException(409, motivo)
    contexto = await _contexto(sin_id(proy))
    partes = proveedor.proponer(contexto, tarea, datos.campo)
    _pid = __import__("uuid").uuid4().hex
    doc = {
        "_id": _pid,
        "id": _pid,
        "proyecto_id": proyecto_id,
        "tarea": tarea,
        "proveedor": proveedor.id,
        "partes": partes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.propuestas.insert_one(doc)
    return sin_id(doc)


@router.post("/propuestas/{propuesta_id}/parte/{parte_id}")
async def resolver_parte(propuesta_id: str, parte_id: str, datos: AceptarParte):
    prop = await db.propuestas.find_one({"_id": propuesta_id})
    if not prop:
        raise HTTPException(404, "Propuesta no encontrada")
    parte = next((p for p in prop["partes"] if p["id"] == parte_id), None)
    if not parte:
        raise HTTPException(404, "Parte no encontrada")

    if datos.accion == "descartar":
        parte["estado"] = "descartada"
        await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
        return {"ok": True, "desarrollo": None}

    # aceptar: escribir en el desarrollo (solo aquí se escribe algo)
    texto = (datos.texto if datos.texto is not None else parte["texto"]).strip()
    campo = datos.destino_campo or parte["destino_campo"]
    if campo not in prov.CAMPOS_VALIDOS:
        raise HTTPException(400, "Debes elegir un campo de destino válido para la respuesta.")
    pid = prop["proyecto_id"]
    des = await db.desarrollos.find_one({"_id": pid}) or {"_id": pid, "estado": "en_curso", "respuestas_formato": {}}
    # Las respuestas a preguntas se añaden; las propuestas de campo reemplazan salvo modo 'anadir'.
    anadir = parte.get("tipo") == "pregunta" or parte.get("modo") == "anadir"
    if anadir and des.get(campo):
        des[campo] = f"{des[campo]}\n{texto}"
    else:
        des[campo] = texto
    des.pop("_id", None)
    des["_id"] = pid
    await db.desarrollos.replace_one({"_id": pid}, des, upsert=True)
    parte["estado"] = "aceptada"
    await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
    return {"ok": True, "desarrollo": sin_id(des)}
