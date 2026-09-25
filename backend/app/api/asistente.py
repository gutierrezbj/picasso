from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.formatos import formato_generico
from app.api.reparto import entradas_reparto
from app.asistente import proveedor as prov
from app.db import db, sin_id
from app.dominio.modelos import AceptarParte, Elemento, FichaVersion, PeticionAsistente, Reparto

router = APIRouter(prefix="/api", tags=["asistente"])

PREFIJO_FORMATO = "formato:"


async def _modelo() -> str:
    aj = await db.ajustes.find_one({"_id": "global"})
    return (aj or {}).get("modelo_asistente", "simulado")


@router.get("/asistente/estado")
async def estado():
    modelo = await _modelo()
    p, motivo = prov.proveedor_actual(modelo)
    return {"disponible": p is not None, "motivo": motivo, "modelo": modelo}


async def _contexto(proyecto: dict, clase: str | None) -> dict:
    des = await db.desarrollos.find_one({"_id": proyecto["id"]})
    fmt = formato_generico(proyecto["tipo"])
    reparto = await entradas_reparto(proyecto["id"])
    aprobados = [
        {
            "nombre": e["elemento"]["nombre"],
            "clase": e["elemento"]["clase"],
            "version": e["version_ficha"],
            "descripcion": (e["ficha"] or {}).get("descripcion"),
        }
        for e in reparto
        if e["elemento"] and e["ficha"] and e["ficha"]["estado"] == "aprobada"
    ]
    nombres = [e["elemento"]["nombre"] for e in reparto if e["elemento"]]
    return {
        "tipo": proyecto["tipo"],
        "desarrollo": sin_id(des) if des else {},
        "formato": fmt,
        "campos": list(prov.CAMPOS_VALIDOS),
        "clase": clase,
        "reparto": aprobados,
        "nombres_en_proyecto": nombres,
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
    clase = datos.clase.value if datos.clase else None
    contexto = await _contexto(sin_id(proy), clase)
    partes = proveedor.proponer(contexto, tarea, datos.campo)
    _pid = uuid.uuid4().hex
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


async def _aceptar_elemento(proyecto_id: str, parte: dict, nombre: str) -> dict:
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    clase = parte.get("clase")
    if clase not in prov.CLASES_ELEMENTO:
        raise HTTPException(400, "La propuesta no indica una clase de elemento válida.")
    ya = await db.elementos.find_one(
        {"espacio_id": proy["espacio_id"], "clase": clase, "nombre": nombre}
    )
    if ya:
        el_doc = ya
    else:
        el = Elemento(espacio_id=proy["espacio_id"], clase=clase, nombre=nombre)
        el_doc = el.model_dump(mode="json")
        el_doc["_id"] = el_doc["id"]
        await db.elementos.insert_one(el_doc)
        ficha = FichaVersion(elemento_id=el.id, version=1)
        fdoc = ficha.model_dump(mode="json")
        fdoc["_id"] = fdoc["id"]
        await db.fichas.insert_one(fdoc)
    elemento_id = el_doc["_id"]
    en_reparto = await db.reparto.find_one({"proyecto_id": proyecto_id, "elemento_id": elemento_id})
    if not en_reparto:
        entrada = Reparto(
            proyecto_id=proyecto_id,
            elemento_id=elemento_id,
            version_ficha=el_doc["ficha_vigente"],
        )
        rdoc = entrada.model_dump(mode="json")
        rdoc["_id"] = rdoc["id"]
        await db.reparto.insert_one(rdoc)
    return {"ok": True, "elemento_id": elemento_id}


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

    pid = prop["proyecto_id"]

    # aceptar un elemento detectado: se crea en el espacio y entra en el reparto,
    # con su ficha v1 en borrador. La descripción y la aprobación las hace el usuario.
    if parte.get("tipo") == "elemento":
        nombre = (datos.texto or parte.get("nombre") or "").strip()
        if not nombre:
            raise HTTPException(400, "El elemento necesita un nombre.")
        resultado = await _aceptar_elemento(pid, parte, nombre)
        parte["estado"] = "aceptada"
        await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
        return resultado

    # aceptar texto: escribir en el desarrollo (solo aquí se escribe algo)
    texto = (datos.texto if datos.texto is not None else parte["texto"]).strip()
    campo = datos.destino_campo or parte["destino_campo"]
    es_formato = isinstance(campo, str) and campo.startswith(PREFIJO_FORMATO)
    if not es_formato and campo not in prov.CAMPOS_VALIDOS:
        raise HTTPException(400, "Debes elegir un campo de destino válido para la respuesta.")
    des = await db.desarrollos.find_one({"_id": pid}) or {
        "_id": pid,
        "estado": "en_curso",
        "respuestas_formato": {},
    }
    # Las respuestas a preguntas se añaden; las propuestas de campo reemplazan salvo modo 'anadir'.
    anadir = parte.get("tipo") == "pregunta" or parte.get("modo") == "anadir"
    if es_formato:
        clave = campo[len(PREFIJO_FORMATO) :]
        respuestas = dict(des.get("respuestas_formato") or {})
        if anadir and respuestas.get(clave):
            respuestas[clave] = f"{respuestas[clave]}\n{texto}"
        else:
            respuestas[clave] = texto
        des["respuestas_formato"] = respuestas
    elif anadir and des.get(campo):
        des[campo] = f"{des[campo]}\n{texto}"
    else:
        des[campo] = texto
    des.pop("_id", None)
    des["_id"] = pid
    await db.desarrollos.replace_one({"_id": pid}, des, upsert=True)
    parte["estado"] = "aceptada"
    await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
    return {"ok": True, "desarrollo": sin_id(des)}
