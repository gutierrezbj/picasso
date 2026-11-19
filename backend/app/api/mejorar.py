from __future__ import annotations

import hashlib
import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.api.taller import _espacio, _referencias_disponibles, proyecto_del_taller
from app.config import config
from app.db import db, sin_id
from app.dominio.modelos import (
    Accion,
    EntradaOperacion,
    EstadoOperacion,
    Operacion,
    ReferenciaTaller,
    SimulacionPrueba,
    ahora,
    nuevo_id,
)
from app.mejorar import calculo, proveedores
from app.motor import catalogo as cat
from app.motor import estados
from app.motor import operaciones as ops

router = APIRouter(prefix="/api", tags=["mejorar"])


class Alcance(BaseModel):
    tipo: str = "nueva"
    toma_id: Optional[str] = None


class BorradorCrear(BaseModel):
    carpeta_id: str
    texto: str = ""
    alcance: Alcance = Field(default_factory=Alcance)


class BorradorGuardar(BaseModel):
    revision: int
    texto: str
    alcance: Alcance = Field(default_factory=Alcance)


class PedirPresupuesto(BaseModel):
    revision: int
    referencias: list[ReferenciaTaller] = Field(default_factory=list)
    relacion: str = "9:16"
    modelo_imagen: Optional[str] = None
    simular_resultado: SimulacionPrueba = SimulacionPrueba.normal


class PedirMejora(BaseModel):
    presupuesto_id: str
    id_peticion: Optional[str] = Field(default=None, max_length=64)
    confirmado_por_encima_del_presupuesto: bool = False


class Aceptar(BaseModel):
    operacion_id: str
    revision: int
    usar_copia: bool = False
    confirmado: bool = False


class Copia(BaseModel):
    operacion_id: str
    texto: str


class SoloOperacion(BaseModel):
    operacion_id: str


def _conflicto(motivo: str, mensaje: str, **extra: Any) -> HTTPException:
    return HTTPException(409, {"motivo": motivo, "mensaje": mensaje, **extra})


async def _borrador(borrador_id: str) -> dict[str, Any]:
    doc = await db.borradores_mesa.find_one({"_id": borrador_id})
    if not doc:
        raise HTTPException(404, "Borrador no encontrado")
    return sin_id(doc)


async def asegurar_indices() -> None:
    await db.presupuestos_mejorar.create_index([("espacio_id", 1), ("emitido_en", -1)], name="por_espacio")
    await db.borradores_mesa.create_index([("espacio_id", 1), ("carpeta_id", 1), ("cerrado_en", 1)], name="abiertos")


@router.get("/espacios/{espacio_id}/borradores")
async def borrador_abierto(espacio_id: str, carpeta_id: str):
    doc = await db.borradores_mesa.find_one(
        {"espacio_id": espacio_id, "carpeta_id": carpeta_id, "cerrado_en": None}, sort=[("actualizado_en", -1)]
    )
    if not doc:
        raise HTTPException(404, "No hay borrador abierto en esta carpeta.")
    return sin_id(doc)


@router.post("/espacios/{espacio_id}/borradores", status_code=201)
async def crear_borrador(espacio_id: str, datos: BorradorCrear, response: Response):
    await _espacio(espacio_id)
    if not await db.carpetas.find_one({"_id": datos.carpeta_id, "espacio_id": espacio_id}):
        raise HTTPException(404, "Carpeta no encontrada")
    previo = await db.borradores_mesa.find_one(
        {"espacio_id": espacio_id, "carpeta_id": datos.carpeta_id, "cerrado_en": None}, sort=[("actualizado_en", -1)]
    )
    if previo:
        response.status_code = 200
        return sin_id(previo)
    doc = {
        "_id": nuevo_id(),
        "espacio_id": espacio_id,
        "carpeta_id": datos.carpeta_id,
        "alcance": datos.alcance.model_dump(),
        "revision": 1,
        "texto": datos.texto,
        "mejoras": [],
        "copia_propuesta": None,
        "actualizado_en": ahora(),
        "cerrado_en": None,
        "created_at": ahora(),
    }
    doc["id"] = doc["_id"]
    await db.borradores_mesa.insert_one(doc)
    return sin_id(doc)


@router.get("/borradores/{borrador_id}")
async def ver_borrador(borrador_id: str):
    return await _borrador(borrador_id)


@router.put("/borradores/{borrador_id}")
async def guardar_borrador(borrador_id: str, datos: BorradorGuardar):
    actual = await _borrador(borrador_id)
    if actual.get("cerrado_en"):
        raise _conflicto("cerrado", "Este borrador ya se usó para generar.", borrador=actual)
    if datos.revision != actual["revision"]:
        raise _conflicto("revision", "El borrador cambió en otra ventana.", borrador=actual)
    alcance = datos.alcance.model_dump()
    if datos.texto == actual["texto"] and alcance == actual.get("alcance"):
        return actual
    doc = await db.borradores_mesa.find_one_and_update(
        {"_id": borrador_id, "revision": datos.revision, "cerrado_en": None},
        {"$set": {"texto": datos.texto, "alcance": alcance, "actualizado_en": ahora()}, "$inc": {"revision": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise _conflicto("revision", "El borrador cambió en otra ventana.", borrador=await _borrador(borrador_id))
    return sin_id(doc)


@router.post("/borradores/{borrador_id}/cerrar")
async def cerrar_borrador(borrador_id: str):
    await _borrador(borrador_id)
    await db.borradores_mesa.update_one({"_id": borrador_id, "cerrado_en": None}, {"$set": {"cerrado_en": ahora()}})
    return await _borrador(borrador_id)


@router.put("/borradores/{borrador_id}/copia")
async def guardar_copia(borrador_id: str, datos: Copia):
    b = await _borrador(borrador_id)
    if not any(m["operacion_id"] == datos.operacion_id for m in b.get("mejoras") or []):
        raise HTTPException(404, "Esa mejora no es de este borrador.")
    await db.borradores_mesa.update_one(
        {"_id": borrador_id}, {"$set": {"copia_propuesta": {"operacion_id": datos.operacion_id, "texto": datos.texto}}}
    )
    return await _borrador(borrador_id)


@router.delete("/borradores/{borrador_id}/copia")
async def borrar_copia(borrador_id: str):
    await _borrador(borrador_id)
    await db.borradores_mesa.update_one({"_id": borrador_id}, {"$set": {"copia_propuesta": None}})
    return await _borrador(borrador_id)




async def _previas(espacio_id: str) -> list[float]:
    ids = [o["_id"] for o in await db.operaciones.find({"espacio_id": espacio_id, "accion": "mejorar_texto"}, {"_id": 1}).to_list(5000)]
    if not ids:
        return []
    docs = (
        await db.intentos.find({"operacion_id": {"$in": ids}, "estado_consumo": "valido", "coste_segun_tarifa": {"$ne": None}})
        .sort("fin", -1)
        .to_list(10)
    )
    return [float(d["coste_segun_tarifa"]) for d in docs]


async def _referencias(espacio_id: str, pedidas: list[str]) -> list[dict[str, Any]]:
    disponibles = {r["medio_id"]: r for r in await _referencias_disponibles(espacio_id)}
    salida = []
    for medio_id in pedidas:
        r = disponibles.get(medio_id)
        if not r:
            raise HTTPException(409, "Esa referencia no es de este espacio.")
        salida.append(r)
    return salida


def _max_referencias(modelo_imagen: Optional[str]) -> int:
    m = cat.modelo(modelo_imagen or "")
    return m.admite.referencias if m else calculo.LIMITE_REFERENCIAS


async def _calcular(espacio_id: str, texto: str, formato: str, referencias_ids: list[str], modelo_imagen: Optional[str]) -> dict[str, Any]:
    refs = await _referencias(espacio_id, referencias_ids)
    try:
        entrada = calculo.construir_entrada(texto, formato, refs, _max_referencias(modelo_imagen))
    except calculo.EntradaInvalida as e:
        raise HTTPException(422, str(e)) from e
    tarifa = dict(calculo.TARIFA)
    configuracion = json.loads(json.dumps(calculo.CONFIGURACION))
    return {
        "entrada": entrada,
        "huella": calculo.huella(entrada),
        "proveedor": proveedores.elegir(),
        "tarifa": tarifa,
        "configuracion": configuracion,
        "reserva_estimada": calculo.reserva_estimada(entrada["bytes"], tarifa, configuracion),
        "estimacion": calculo.estimacion(entrada["bytes"], tarifa, await _previas(espacio_id)),
        "aviso_tarifa": calculo.aviso_tarifa(tarifa),
    }


def _igual(guardado: dict[str, Any], nuevo: dict[str, Any]) -> bool:
    return all(guardado.get(k) == nuevo.get(k) for k in ("huella", "proveedor", "tarifa", "configuracion", "reserva_estimada"))


async def _emitir(base: dict[str, Any], calculado: dict[str, Any], simulacion: str) -> dict[str, Any]:
    if simulacion != "normal" and calculado["proveedor"] != "simulado":
        raise HTTPException(422, "«Prueba · simular resultado» solo existe con el proveedor simulado.")
    doc = {
        "_id": nuevo_id(),
        **base,
        **calculado,
        "simulacion": simulacion,
        "emitido_en": ahora(),
        "usado_por": None,
    }
    doc["id"] = doc["_id"]
    await db.presupuestos_mejorar.insert_one(doc)
    return _vista_presupuesto(sin_id(doc))


def _vista_presupuesto(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": p["id"],
        "tipo": p["tipo"],
        "borrador_id": p.get("borrador_id"),
        "revision": p.get("revision"),
        "operacion_id": p.get("operacion_id"),
        "proveedor": p["proveedor"],
        "estimacion": p["estimacion"],
        "reserva_estimada": p["reserva_estimada"],
        "tarifa": p["tarifa"],
        "configuracion": p["configuracion"],
        "huella_entrada": p["huella"],
        "aviso_tarifa": p.get("aviso_tarifa"),
        "referencias": p["entrada"]["referencias"],
        "bytes_entrada": p["entrada"]["bytes"],
        "simulacion": p.get("simulacion"),
        "emitido_en": p["emitido_en"],
        "usado_por": p.get("usado_por"),
    }


@router.post("/borradores/{borrador_id}/mejorar/presupuesto", status_code=201)
async def presupuesto_borrador(borrador_id: str, datos: PedirPresupuesto):
    b = await _borrador(borrador_id)
    if b.get("cerrado_en"):
        raise _conflicto("cerrado", "Este borrador ya se usó para generar.", borrador=b)
    if datos.revision != b["revision"]:
        raise _conflicto("revision", "La revisión ya no es la actual: guarda antes de presupuestar.", borrador=b)
    refs = [r.medio_id for r in datos.referencias]
    calculado = await _calcular(b["espacio_id"], b["texto"], datos.relacion, refs, datos.modelo_imagen)
    base = {
        "tipo": "borrador",
        "espacio_id": b["espacio_id"],
        "borrador_id": borrador_id,
        "revision": b["revision"],
        "carpeta_id": b["carpeta_id"],
        "alcance": b.get("alcance"),
        "referencias_ids": refs,
        "formato": datos.relacion,
        "modelo_imagen": datos.modelo_imagen,
    }
    return await _emitir(base, calculado, datos.simular_resultado.value)


async def _bloqueo(espacio_id: str) -> Optional[dict[str, Any]]:
    op = await db.operaciones.find_one(
        {"espacio_id": espacio_id, "accion": "mejorar_texto", "mejorar.bloqueo.activo": True}, sort=[("updated_at", -1)]
    )
    if not op:
        return None
    return {"operacion_id": op["_id"], **op["mejorar"]["bloqueo"]}


async def _exigir_sin_bloqueo(espacio_id: str) -> None:
    bloqueo = await _bloqueo(espacio_id)
    if bloqueo:
        raise _conflicto(
            "bloqueo",
            f"Mejorar está bloqueado: una mejora {bloqueo['motivo']}. Revísalo y pulsa «Entendido, seguir».",
            bloqueo=bloqueo,
        )


async def _comprobar_presupuesto(p: dict[str, Any], calculado: dict[str, Any]) -> None:
    if p.get("usado_por"):
        raise _conflicto("usado", "Ese presupuesto ya se usó en otra mejora: pide uno nuevo.")
    if not _igual(p, calculado):
        base = {k: p.get(k) for k in ("tipo", "espacio_id", "borrador_id", "revision", "carpeta_id", "alcance", "referencias_ids", "formato", "modelo_imagen", "operacion_id")}
        nuevo = await _emitir(base, calculado, p.get("simulacion") or "normal")
        raise _conflicto("precio", f"El precio cambió: reserva estimada {str(round(nuevo['reserva_estimada'], 4)).replace('.', ',')} $. Pulsa otra vez para mejorar con este precio.", presupuesto=nuevo)


async def _reclamar(presupuesto_id: str, op_id: str) -> None:
    hecho = await db.presupuestos_mejorar.update_one({"_id": presupuesto_id, "usado_por": None}, {"$set": {"usado_por": op_id}})
    if not hecho.modified_count:
        raise _conflicto("usado", "Ese presupuesto ya se usó en otra mejora: pide uno nuevo.")


def _datos_operacion(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "presupuesto_id": p["id"],
        "borrador_id": p.get("borrador_id"),
        "revision": p.get("revision"),
        "carpeta_id": p.get("carpeta_id"),
        "alcance": p.get("alcance"),
        "texto_original": p["entrada"]["texto"],
        "formato": p.get("formato"),
        "referencias": p["entrada"]["referencias"],
        "entrada": p["entrada"],
        "huella": p["huella"],
        "tarifa": p["tarifa"],
        "configuracion": p["configuracion"],
        "estimacion": p["estimacion"],
        "reserva_estimada": p["reserva_estimada"],
        "aviso_tarifa": p.get("aviso_tarifa"),
        "resultado": None,
        "marcas": [],
        "bloqueo": None,
    }


@router.post("/borradores/{borrador_id}/mejorar", status_code=201)
async def mejorar(borrador_id: str, datos: PedirMejora, response: Response):
    b = await _borrador(borrador_id)
    espacio_id = b["espacio_id"]
    if datos.id_peticion:
        previa = await ops.por_peticion(espacio_id, datos.id_peticion)
        if previa:
            response.status_code = 200
            op_previa = previa["operacion"]
            if op_previa["estado"] != "presupuestada" or int(op_previa.get("intentos") or 0) > 0:
                return previa
            try:
                return {**await ops.autorizar(op_previa["id"], datos.confirmado_por_encima_del_presupuesto), "repetida": True}
            except PermissionError as e:
                raise HTTPException(409, str(e)) from e
    p = await db.presupuestos_mejorar.find_one({"_id": datos.presupuesto_id, "borrador_id": borrador_id})
    if not p:
        raise HTTPException(404, "Presupuesto no encontrado para este borrador.")
    p = sin_id(p)
    await _exigir_sin_bloqueo(espacio_id)
    if b.get("cerrado_en"):
        raise _conflicto("cerrado", "Este borrador ya se usó para generar.", borrador=b)
    if p["revision"] != b["revision"]:
        raise _conflicto("revision", "El borrador cambió en otra ventana; revisa antes de mejorar.", borrador=b)
    calculado = await _calcular(espacio_id, b["texto"], p["formato"], p["referencias_ids"], p.get("modelo_imagen"))
    await _comprobar_presupuesto(p, calculado)
    op_id = nuevo_id()
    await _reclamar(p["id"], op_id)
    entradas = EntradaOperacion(
        accion=Accion.mejorar_texto,
        modelo=calculo.MODELO,
        texto=p["entrada"]["mensaje"],
        simular_resultado=SimulacionPrueba(p.get("simulacion") or "normal"),
    )
    op = Operacion(
        id=op_id,
        proyecto_id=proyecto_del_taller(espacio_id),
        espacio_id=espacio_id,
        destino={"tipo": "borrador", "id": borrador_id},
        accion=Accion.mejorar_texto,
        modelo=calculo.MODELO,
        entradas=entradas,
        prompt_visible=p["entrada"]["texto"],
        estado=EstadoOperacion.presupuestada,
    ).model_dump(mode="json")
    op.update(
        {
            "_id": op_id,
            "proveedor": p["proveedor"],
            "coste_estimado": p["reserva_estimada"],
            "coste_unidad": "operacion",
            "coste_verificado": True,
            "tarifa_verificada_en": p["tarifa"]["verificada_en"],
            "clave_idempotencia": hashlib.sha256(f"{op_id}:1:{p['huella']}".encode()).hexdigest(),
            "mejorar": _datos_operacion(p),
        }
    )
    if datos.id_peticion:
        op["id_peticion"] = datos.id_peticion
    try:
        await db.operaciones.insert_one(op)
    except DuplicateKeyError:
        await db.presupuestos_mejorar.update_one({"_id": p["id"]}, {"$set": {"usado_por": None}})
        previa = await ops.por_peticion(espacio_id, datos.id_peticion or "")
        if previa:
            response.status_code = 200
            return previa
        raise
    await db.borradores_mesa.update_one(
        {"_id": borrador_id}, {"$push": {"mejoras": {"operacion_id": op_id, "revision": p["revision"], "estado": None}}}
    )
    try:
        return await ops.autorizar(op_id, datos.confirmado_por_encima_del_presupuesto)
    except PermissionError as e:
        raise HTTPException(409, str(e)) from e


class PedirReintento(BaseModel):
    simular_resultado: Optional[SimulacionPrueba] = None


@router.post("/operaciones/{operacion_id}/mejorar/presupuesto", status_code=201)
async def presupuesto_reintento(operacion_id: str, datos: PedirReintento | None = None):
    op = await db.operaciones.find_one({"_id": operacion_id, "accion": "mejorar_texto"})
    if not op:
        raise HTTPException(404, "Mejora no encontrada")
    if op["estado"] != EstadoOperacion.fallida.value:
        raise _conflicto("estado", "Solo se vuelve a pedir una mejora fallida o incompleta. Si está incierta, márcala fallida antes.")
    calculado = await _calcular_reintento(op)
    base = {
        "tipo": "reintento",
        "espacio_id": op["espacio_id"],
        "operacion_id": operacion_id,
        "borrador_id": op["mejorar"].get("borrador_id"),
        "revision": op["mejorar"].get("revision"),
        "carpeta_id": op["mejorar"].get("carpeta_id"),
        "alcance": op["mejorar"].get("alcance"),
        "formato": op["mejorar"].get("formato"),
    }
    simulacion = datos.simular_resultado.value if datos and datos.simular_resultado else ((op.get("entradas") or {}).get("simular_resultado") or "normal")
    return await _emitir(base, calculado, simulacion)


async def _calcular_reintento(op: dict[str, Any]) -> dict[str, Any]:
    entrada = op["mejorar"]["entrada"]
    tarifa = dict(calculo.TARIFA)
    configuracion = json.loads(json.dumps(calculo.CONFIGURACION))
    return {
        "entrada": entrada,
        "huella": calculo.huella(entrada),
        "proveedor": proveedores.elegir(),
        "tarifa": tarifa,
        "configuracion": configuracion,
        "reserva_estimada": calculo.reserva_estimada(entrada["bytes"], tarifa, configuracion),
        "estimacion": calculo.estimacion(entrada["bytes"], tarifa, await _previas(op["espacio_id"])),
        "aviso_tarifa": calculo.aviso_tarifa(tarifa),
    }


@router.post("/operaciones/{operacion_id}/mejorar/reintentar")
async def reintentar(operacion_id: str, datos: PedirMejora):
    op = await db.operaciones.find_one({"_id": operacion_id, "accion": "mejorar_texto"})
    if not op:
        raise HTTPException(404, "Mejora no encontrada")
    p = await db.presupuestos_mejorar.find_one({"_id": datos.presupuesto_id, "operacion_id": operacion_id, "tipo": "reintento"})
    if not p:
        raise HTTPException(404, "Presupuesto no encontrado para esta mejora.")
    p = sin_id(p)
    await _exigir_sin_bloqueo(op["espacio_id"])
    if op["estado"] != EstadoOperacion.fallida.value:
        raise _conflicto("estado", "Solo se vuelve a pedir una mejora fallida o incompleta.")
    await _comprobar_presupuesto(p, await _calcular_reintento(op))
    await _reclamar(p["id"], operacion_id)
    numero = int(op.get("intentos") or 0) + 1
    try:
        await ops.guardar_estado(
            operacion_id,
            EstadoOperacion.presupuestada.value,
            {
                "coste_estimado": p["reserva_estimada"],
                "tarifa_verificada_en": p["tarifa"]["verificada_en"],
                "proveedor": p["proveedor"],
                "clave_idempotencia": hashlib.sha256(f"{operacion_id}:{numero}:{p['huella']}".encode()).hexdigest(),
                "error": None,
                "autorizada_en": None,
                "mejorar.presupuesto_id": p["id"],
                "mejorar.tarifa": p["tarifa"],
                "mejorar.configuracion": p["configuracion"],
                "mejorar.reserva_estimada": p["reserva_estimada"],
                "mejorar.estimacion": p["estimacion"],
                "mejorar.resultado": None,
                "entradas.simular_resultado": p.get("simulacion") or "normal",
            },
        )
        return await ops.autorizar(operacion_id, datos.confirmado_por_encima_del_presupuesto)
    except estados.TransicionNoPermitida as e:
        raise HTTPException(409, str(e)) from e
    except PermissionError as e:
        raise HTTPException(409, str(e)) from e


@router.post("/operaciones/{operacion_id}/mejorar/entendido")
async def entendido(operacion_id: str):
    hecho = await db.operaciones.update_one(
        {"_id": operacion_id, "accion": "mejorar_texto", "mejorar.bloqueo.activo": True},
        {"$set": {"mejorar.bloqueo.activo": False, "mejorar.bloqueo.entendido_en": ahora()}},
    )
    if not hecho.modified_count:
        raise HTTPException(409, "Esa mejora no tiene un bloqueo activo.")
    return {"ok": True}




async def _vista_mejora(op: dict[str, Any], borrador: dict[str, Any], intentos: list[dict[str, Any]]) -> dict[str, Any]:
    m = op.get("mejorar") or {}
    entrada_b = next((x for x in borrador.get("mejoras") or [] if x["operacion_id"] == op["_id"]), {})
    anterior = m.get("revision") != borrador["revision"] or m.get("alcance") != borrador.get("alcance")
    return {
        "id": op["_id"],
        "estado": op["estado"],
        "error": op.get("error"),
        "proveedor": op.get("proveedor"),
        "revision": m.get("revision"),
        "alcance": m.get("alcance"),
        "texto_original": m.get("texto_original"),
        "referencias": m.get("referencias") or [],
        "resultado": m.get("resultado"),
        "marcas": m.get("marcas") or [],
        "bloqueo": m.get("bloqueo"),
        "estimacion": m.get("estimacion"),
        "reserva_estimada": m.get("reserva_estimada"),
        "tarifa": m.get("tarifa"),
        "aviso_tarifa": m.get("aviso_tarifa"),
        "para_texto_anterior": anterior,
        "decision": entrada_b.get("estado"),
        "intentos": int(op.get("intentos") or 0),
        "coste": ops.coste_de(op, intentos),
        "created_at": op.get("created_at"),
    }


@router.get("/borradores/{borrador_id}/mejoras")
async def mejoras(borrador_id: str):
    b = await _borrador(borrador_id)
    docs = await db.operaciones.find({"destino.tipo": "borrador", "destino.id": borrador_id}).sort("created_at", -1).to_list(200)
    por_op = await ops.intentos_por_operacion([d["_id"] for d in docs])
    return {
        "borrador": b,
        "mejoras": [await _vista_mejora(d, b, por_op.get(d["_id"], [])) for d in docs],
        "bloqueo": await _bloqueo(b["espacio_id"]),
    }


@router.get("/espacios/{espacio_id}/mejorar/estado")
async def estado_mejorar(espacio_id: str):
    await _espacio(espacio_id)
    return {
        "proveedor": proveedores.elegir(),
        "tarifa": calculo.TARIFA,
        "configuracion": calculo.CONFIGURACION,
        "aviso_tarifa": calculo.aviso_tarifa(calculo.TARIFA),
        "limites": {
            "texto": calculo.LIMITE_TEXTO,
            "referencias": calculo.LIMITE_REFERENCIAS,
            "nombre": calculo.LIMITE_NOMBRE,
            "rasgos": calculo.LIMITE_RASGOS,
            "margen_tokens": calculo.MARGEN_TOKENS,
        },
        "bloqueo": await _bloqueo(espacio_id),
    }


async def _decision(borrador_id: str, operacion_id: str, estado: str, extra: Optional[dict[str, Any]] = None) -> None:
    await db.borradores_mesa.update_one(
        {"_id": borrador_id, "mejoras.operacion_id": operacion_id},
        {"$set": {"mejoras.$.estado": estado, **(extra or {})}},
    )


@router.post("/borradores/{borrador_id}/aceptar")
async def aceptar(borrador_id: str, datos: Aceptar):
    b = await _borrador(borrador_id)
    op = await db.operaciones.find_one({"_id": datos.operacion_id, "destino.tipo": "borrador", "destino.id": borrador_id})
    if not op:
        raise HTTPException(404, "Esa mejora no es de este borrador.")
    if b.get("cerrado_en"):
        raise _conflicto("cerrado", "Este borrador ya se usó para generar.", borrador=b)
    if datos.revision != b["revision"]:
        raise _conflicto("revision", "El borrador cambió en otra ventana.", borrador=b)
    resultado = (op.get("mejorar") or {}).get("resultado") or {}
    if datos.usar_copia:
        copia = b.get("copia_propuesta") or {}
        if copia.get("operacion_id") != datos.operacion_id or not (copia.get("texto") or "").strip():
            raise HTTPException(409, "No hay una copia editada de esta propuesta.")
        texto = copia["texto"]
    else:
        if not (op["estado"] == EstadoOperacion.completada.value and resultado.get("calidad") == "completa"):
            raise HTTPException(409, "Esta propuesta no se puede aceptar directamente: edítala antes de aceptar o descártala.")
        texto = resultado["texto"]
    m = op.get("mejorar") or {}
    if (m.get("revision") != b["revision"] or m.get("alcance") != b.get("alcance")) and not datos.confirmado:
        raise _conflicto("anterior", "Es una propuesta para un texto anterior: sustituirá lo que tienes ahora.", revision=m.get("revision"))
    doc = await db.borradores_mesa.find_one_and_update(
        {"_id": borrador_id, "revision": datos.revision, "cerrado_en": None},
        {
            "$set": {"texto": texto, "actualizado_en": ahora(), "copia_propuesta": None},
            "$inc": {"revision": 1},
        },
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise _conflicto("revision", "El borrador cambió en otra ventana.", borrador=await _borrador(borrador_id))
    await _decision(borrador_id, datos.operacion_id, "aceptada")
    return {"borrador": await _borrador(borrador_id), "anterior": b["texto"], "revision_anterior": b["revision"]}


@router.post("/borradores/{borrador_id}/descartar")
async def descartar(borrador_id: str, datos: SoloOperacion):
    b = await _borrador(borrador_id)
    if not any(x["operacion_id"] == datos.operacion_id for x in b.get("mejoras") or []):
        raise HTTPException(404, "Esa mejora no es de este borrador.")
    extra = {}
    if (b.get("copia_propuesta") or {}).get("operacion_id") == datos.operacion_id:
        extra["copia_propuesta"] = None
    await _decision(borrador_id, datos.operacion_id, "descartada", extra)
    return await _borrador(borrador_id)


_TARIFA_ORIGINAL = dict(calculo.TARIFA)
_CONFIGURACION_ORIGINAL = json.loads(json.dumps(calculo.CONFIGURACION))


class ParametrosPrueba(BaseModel):
    tarifa: dict[str, Any] = Field(default_factory=dict)
    configuracion: dict[str, Any] = Field(default_factory=dict)
    restaurar: bool = False


@router.post("/pruebas/mejorar/parametros")
async def parametros_de_prueba(datos: ParametrosPrueba):
    if config.DB_NAME != config.DB_NAME_PRUEBAS:
        raise HTTPException(403, "Solo en la instancia de pruebas.")
    if datos.restaurar:
        calculo.TARIFA.clear()
        calculo.TARIFA.update(_TARIFA_ORIGINAL)
        calculo.CONFIGURACION.clear()
        calculo.CONFIGURACION.update(json.loads(json.dumps(_CONFIGURACION_ORIGINAL)))
    calculo.TARIFA.update(datos.tarifa)
    calculo.CONFIGURACION.update(datos.configuracion)
    return {"tarifa": calculo.TARIFA, "configuracion": calculo.CONFIGURACION}


@router.get("/pruebas/mejorar/envios")
async def envios_de_prueba():
    if config.DB_NAME != config.DB_NAME_PRUEBAS:
        raise HTTPException(403, "Solo en la instancia de pruebas.")
    return {"simulado": proveedores.proveedor("simulado").envios}
