from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.formatos import formato_generico
from app.api.guiones import _activas, _asegurar_trabajo, _guion_de_pieza, _guion_por_id
from app.api.reparto import entradas_reparto
from app.asistente import proveedor as prov
from app.db import db, sin_id
from app.dominio.modelos import (
    AceptarParte,
    Elemento,
    Escena,
    FichaVersion,
    PeticionAsistente,
    Reparto,
    ahora,
)

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


async def _contexto(proyecto: dict, clase: str | None, pieza_id: str | None = None, escena_id: str | None = None) -> dict:
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
    escenas: list = []
    escena = None
    if pieza_id:
        guion = await _guion_de_pieza(pieza_id)
        escenas = await _activas(guion)
        if escena_id:
            escena = next((e for e in escenas if e["id"] == escena_id), None)
            if escena is None:
                aprobadas = [e for e in await _activas(guion)]
                escena = next((e for e in aprobadas if e.get("origen_id") == escena_id), None)
    return {
        "tipo": proyecto["tipo"],
        "desarrollo": sin_id(des) if des else {},
        "formato": fmt,
        "campos": list(prov.CAMPOS_VALIDOS),
        "clase": clase,
        "reparto": aprobados,
        "nombres_en_proyecto": nombres,
        "pieza_id": pieza_id,
        "escenas": escenas,
        "escena": escena,
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
    contexto = await _contexto(sin_id(proy), clase, datos.pieza_id, datos.escena_id)
    partes = proveedor.proponer(contexto, tarea, datos.campo)
    _pid = uuid.uuid4().hex
    doc = {
        "_id": _pid,
        "id": _pid,
        "proyecto_id": proyecto_id,
        "pieza_id": datos.pieza_id,
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


async def _aceptar_escena(pieza_id: str, titulo: str, que_ocurre: str) -> dict:
    guion = await _asegurar_trabajo(await _guion_de_pieza(pieza_id))
    if guion["clase"] == "encargo":
        raise HTTPException(409, "Un encargo de imagen no tiene escenas.")
    activas = await _activas(guion)
    escena = Escena(
        guion_id=guion["id"],
        orden=len(activas) + 1,
        borrador=True,
        titulo=titulo,
        que_ocurre=que_ocurre,
    )
    doc = escena.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.escenas.insert_one(doc)
    return {"ok": True, "escena_id": escena.id}


async def _aceptar_escena_campo(pieza_id: str, escena_id: str, campo: str, texto: str) -> dict:
    if campo not in prov.CAMPOS_ESCENA_VALIDOS:
        raise HTTPException(400, "Campo de escena no válido.")
    guion = await _asegurar_trabajo(await _guion_de_pieza(pieza_id))
    activas = await _activas(guion)
    destino = next((e for e in activas if e["id"] == escena_id), None)
    if destino is None:
        destino = next((e for e in activas if e.get("origen_id") == escena_id), None)
    if destino is None:
        raise HTTPException(404, "La escena de la propuesta ya no existe.")
    await db.escenas.update_one(
        {"_id": destino["id"]}, {"$set": {campo: texto, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True, "escena_id": destino["id"]}


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

    # aceptar una escena propuesta o la reescritura de un campo de escena (§6.3)
    if parte.get("tipo") == "escena":
        if not prop.get("pieza_id"):
            raise HTTPException(409, "La propuesta no sabe a qué pieza pertenece.")
        titulo = (datos.texto or parte.get("nombre") or "").strip()
        if not titulo:
            raise HTTPException(400, "La escena necesita un título.")
        # Con el proveedor simulado el texto es el aviso de que es simulado, no contenido.
        que_ocurre = (parte.get("texto") or "") if prop["proveedor"] != "simulado" else ""
        resultado = await _aceptar_escena(prop["pieza_id"], titulo, que_ocurre)
        parte["estado"] = "aceptada"
        await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
        return resultado

    if parte.get("tipo") == "escena_campo":
        if not prop.get("pieza_id") or not parte.get("escena_id"):
            raise HTTPException(409, "La propuesta no sabe a qué escena pertenece.")
        texto = (datos.texto if datos.texto is not None else parte["texto"]).strip()
        resultado = await _aceptar_escena_campo(
            prop["pieza_id"], parte["escena_id"], parte["destino_campo"], texto
        )
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
    des["updated_at"] = ahora()
    await db.desarrollos.replace_one({"_id": pid}, des, upsert=True)
    parte["estado"] = "aceptada"
    await db.propuestas.update_one({"_id": propuesta_id}, {"$set": {"partes": prop["partes"]}})
    return {"ok": True, "desarrollo": sin_id(des)}
