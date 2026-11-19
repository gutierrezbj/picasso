from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Optional

from app.db import db, sin_id
from app.dominio.modelos import EstadoOperacion, Intento, ahora
from app.mejorar import calculo
from app.mejorar.proveedores import NoEncontrada, Rechazo, RespuestaRemota, SinRespuesta, proveedor
from app.motor import operaciones as ops

TERMINALES = ("completed", "incomplete", "failed", "cancelled")


def plazo_s() -> float:
    return float(os.environ.get("MEJORAR_PLAZO_S") or 900)


def intervalo_s() -> float:
    return float(os.environ.get("MEJORAR_INTERVALO_S") or 2)


def _minutos(segundos: float) -> str:
    return f"{segundos / 60:g} minutos" if segundos >= 60 else f"{segundos:g} segundos"


async def _ultimo_intento(op_id: str) -> Optional[dict[str, Any]]:
    return await db.intentos.find_one({"operacion_id": op_id}, sort=[("numero", -1)])


async def procesar(op_id: str) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    datos = op["mejorar"]
    prov = proveedor(op["proveedor"])
    numero = int(op.get("intentos") or 0) + 1
    intento = Intento(
        operacion_id=op_id,
        numero=numero,
        proveedor=op["proveedor"],
        clave_idempotencia=op["clave_idempotencia"],
        coste_estimado=op.get("coste_estimado"),
    ).model_dump(mode="json")
    intento.update(
        {
            "_id": intento["id"],
            "presupuesto_id": datos.get("presupuesto_id"),
            "tarifa_aplicada": datos["tarifa"],
            "configuracion": datos["configuracion"],
            "estado_consumo": None,
            "coste_segun_tarifa": None,
        }
    )
    await db.intentos.insert_one(intento)
    await db.operaciones.update_one({"_id": op_id}, {"$set": {"intentos": numero}})
    await ops.guardar_estado(op_id, EstadoOperacion.enviada.value)
    simulacion = (op.get("entradas") or {}).get("simular_resultado") or "normal"
    try:
        id_remoto = await prov.crear(datos["entrada"], datos["configuracion"], simulacion)
    except Rechazo as e:
        cambios: dict[str, Any] = {"estado": "fallida", "error": str(e), "fin": ahora(), "estado_respuesta": "rechazada"}
        if e.usage is not None:
            cambios.update(_campos_consumo(calculo.evaluar_consumo(e.usage, datos["tarifa"], datos["configuracion"])))
        await db.intentos.update_one({"_id": intento["id"]}, {"$set": cambios})
        await ops.guardar_estado(op_id, EstadoOperacion.fallida.value, {"error": str(e)})
        return
    except SinRespuesta as e:
        await db.intentos.update_one(
            {"_id": intento["id"]}, {"$set": {"estado": "incierta", "error": str(e), "id_remoto": e.id_remoto}}
        )
        motivo = str(e) if e.id_remoto else f"{e} No se puede consultar: no llegó el identificador."
        await ops.guardar_estado(op_id, EstadoOperacion.incierta.value, {"error": motivo + " No se reenvía nada solo."})
        return
    await db.intentos.update_one({"_id": intento["id"]}, {"$set": {"id_remoto": id_remoto, "estado": "en_curso"}})
    await ops.guardar_estado(op_id, EstadoOperacion.en_curso.value)
    await seguir(op_id, id_remoto)


async def seguir(op_id: str, id_remoto: str) -> None:
    prov = proveedor((await db.operaciones.find_one({"_id": op_id}) or {}).get("proveedor") or "")
    limite = plazo_s()
    inicio = time.monotonic()
    while time.monotonic() - inicio < limite:
        try:
            resp = await prov.consultar(id_remoto)
        except NoEncontrada as e:
            await _incierta(op_id, f"{e} No es coste cero: resuélvelo a mano.", "caducada")
            return
        except SinRespuesta:
            resp = None
        if resp is not None and resp.estado in TERMINALES:
            await finalizar(op_id, resp)
            return
        await asyncio.sleep(intervalo_s())
    await _incierta(op_id, f"Sin final de OpenAI en {_minutos(limite)}. «Comprobar» vuelve a consultar.", "sin_final")


async def _incierta(op_id: str, motivo: str, causa: str) -> None:
    intento = await _ultimo_intento(op_id)
    if intento:
        await db.intentos.update_one({"_id": intento["_id"]}, {"$set": {"estado": "incierta", "error": motivo, "causa_incierta": causa}})
    doc = await db.operaciones.find_one({"_id": op_id})
    if doc and doc["estado"] == EstadoOperacion.incierta.value:
        await db.operaciones.update_one({"_id": op_id}, {"$set": {"error": motivo, "updated_at": ahora()}})
        return
    await ops.guardar_estado(op_id, EstadoOperacion.incierta.value, {"error": motivo})


def _campos_consumo(consumo: dict[str, Any]) -> dict[str, Any]:
    return {
        "estado_consumo": consumo["estado_consumo"],
        "consumo": consumo.get("consumo"),
        "tokens": consumo.get("tokens"),
        "coste_segun_tarifa": consumo.get("coste_segun_tarifa"),
        "marcas": consumo.get("marcas") or [],
        "posible_cargo": consumo["estado_consumo"] != "valido",
    }


async def finalizar(op_id: str, resp: RespuestaRemota) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    intento = await _ultimo_intento(op_id)
    tarifa = intento.get("tarifa_aplicada") or op["mejorar"]["tarifa"]
    configuracion = intento.get("configuracion") or op["mejorar"]["configuracion"]
    consumo = calculo.evaluar_consumo(resp.usage, tarifa, configuracion)
    propuesta = calculo.evaluar_propuesta(resp.estado, resp.texto, resp.motivo, int(configuracion["max_output_tokens"]))
    reserva = float(intento.get("coste_estimado") or 0)
    coste = consumo.get("coste_segun_tarifa")
    marcas = list(consumo.get("marcas") or [])
    bloqueo = None
    if consumo["estado_consumo"] == "valido" and coste is not None and coste > reserva:
        marcas.append(f"superó la reserva estimada ({coste:.4f} $ > {reserva:.4f} $)")
        bloqueo = marcas[-1]
    if "escritura en caché no esperada" in marcas:
        bloqueo = bloqueo or "escritura en caché no esperada"
    estimacion = float(op["mejorar"].get("estimacion") or 0)
    if coste is not None and coste > estimacion and not bloqueo:
        marcas.append(f"superó la estimación ({coste:.4f} $ > {estimacion:.4f} $)")
    campos = _campos_consumo(consumo)
    campos["marcas"] = marcas
    await db.intentos.update_one(
        {"_id": intento["_id"]},
        {
            "$set": {
                **campos,
                "estado": "completada" if resp.estado in ("completed", "incomplete") else "fallida",
                "estado_respuesta": resp.estado,
                "motivo_incompleta": resp.motivo,
                "propuesta": propuesta,
                "error": resp.error,
                "fin": ahora(),
            }
        },
    )
    extra: dict[str, Any] = {
        "mejorar.resultado": {**propuesta, "intento": intento["numero"], "estado_respuesta": resp.estado, "estado_consumo": consumo["estado_consumo"]},
        "mejorar.marcas": marcas,
    }
    if bloqueo:
        extra["mejorar.bloqueo"] = {"activo": True, "motivo": bloqueo, "desde": ahora()}
    if resp.estado == "completed" and propuesta["calidad"] == "completa":
        await ops.guardar_estado(op_id, EstadoOperacion.completada.value, {**extra, "error": None})
        return
    if resp.estado in ("completed", "incomplete"):
        error = propuesta.get("aviso") or "No hubo propuesta."
    else:
        error = resp.error or f"OpenAI terminó la respuesta como «{resp.estado}»."
    await ops.guardar_estado(op_id, EstadoOperacion.fallida.value, {**extra, "error": error})


async def comprobar(op_id: str) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    if op["estado"] not in ("incierta", "enviada", "en_curso"):
        return
    intento = await _ultimo_intento(op_id)
    id_remoto = (intento or {}).get("id_remoto")
    if not id_remoto:
        await db.operaciones.update_one(
            {"_id": op_id},
            {"$set": {"error": "No se puede consultar: no llegó el identificador. Márcala fallida y resuelve el posible cargo mirando el panel de uso de OpenAI.", "updated_at": ahora()}},
        )
        return
    prov = proveedor(op["proveedor"])
    try:
        resp = await prov.consultar(id_remoto)
    except NoEncontrada as e:
        await _incierta(op_id, f"{e} No es coste cero: resuélvelo a mano.", "caducada")
        return
    except SinRespuesta as e:
        await _incierta(op_id, f"{e} Sigue incierta: vuelve a comprobar.", "sin_respuesta")
        return
    if resp.estado in TERMINALES:
        await finalizar(op_id, resp)
        return
    if op["estado"] != EstadoOperacion.en_curso.value:
        await ops.guardar_estado(op_id, EstadoOperacion.en_curso.value)
    asyncio.create_task(seguir(op_id, id_remoto))


async def retomar(doc: dict[str, Any]) -> bool:
    intento = await _ultimo_intento(doc["_id"])
    id_remoto = (intento or {}).get("id_remoto")
    if id_remoto:
        asyncio.create_task(seguir(doc["_id"], id_remoto))
        return True
    return False
