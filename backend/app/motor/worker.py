"""Worker del motor (§15.1: tarea de fondo en el proceso de FastAPI, cola en
MongoDB). Envía, sigue, completa y recupera. Concurrencia 2 por proveedor con
posición de cola visible. Al arrancar retoma lo que quedó a medias y NUNCA
reenvía nada."""
from __future__ import annotations

import asyncio
import hashlib
import json
import mimetypes
import os
import subprocess
from pathlib import Path
from typing import Any, Optional

from app.almacen import almacen
from app.config import config
from app.db import db, sin_id
from app.dominio.modelos import (
    EntradaOperacion,
    EstadoOperacion,
    Intento,
    Medio,
    Toma,
    ahora,
)
from app.motor import catalogo as cat
from app.motor import estados, eventos
from app.motor import operaciones as ops
from app.motor.contrato import ErrorProveedor, EstadoRemotoNombre, Proveedor, SinRespuesta
from app.motor.proveedores.simulado import ProveedorSimulado

CONCURRENCIA = int(os.environ.get("CONCURRENCIA_PROVEEDOR") or 2)

_PROVEEDORES: dict[str, Proveedor] = {
    "simulado": ProveedorSimulado(config.DATA_DIR / "simulado"),
}

_semaforos: dict[str, asyncio.Semaphore] = {}
_colas: dict[str, list[str]] = {}

CLASE_POR_EXTENSION = {".png": "imagen", ".jpg": "imagen", ".mp4": "video", ".wav": "audio"}


def proveedor(proveedor_id: Optional[str]) -> Optional[Proveedor]:
    return _PROVEEDORES.get(proveedor_id or "")


def _semaforo(proveedor_id: str) -> asyncio.Semaphore:
    if proveedor_id not in _semaforos:
        _semaforos[proveedor_id] = asyncio.Semaphore(CONCURRENCIA)
    return _semaforos[proveedor_id]


async def _actualizar_cola(proveedor_id: str) -> None:
    for i, op_id in enumerate(_colas.get(proveedor_id) or []):
        await db.operaciones.update_one({"_id": op_id}, {"$set": {"posicion_cola": i + 1}})
        doc = await db.operaciones.find_one({"_id": op_id})
        if doc:
            eventos.publicar(doc["proyecto_id"], {"tipo": "operacion", "operacion": sin_id(doc)})


async def encolar(op: dict[str, Any]) -> None:
    proveedor_id = op["proveedor"]
    _colas.setdefault(proveedor_id, []).append(op["id"])
    await _actualizar_cola(proveedor_id)
    asyncio.create_task(_procesar(op["id"]))


async def _procesar(op_id: str) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    proveedor_id = op["proveedor"]
    async with _semaforo(proveedor_id):
        cola = _colas.get(proveedor_id) or []
        if op_id in cola:
            cola.remove(op_id)
        await db.operaciones.update_one({"_id": op_id}, {"$set": {"posicion_cola": None}})
        await _actualizar_cola(proveedor_id)
        await _enviar_y_seguir(op_id)


async def _intento_actual(op_id: str) -> Optional[dict[str, Any]]:
    doc = await db.intentos.find_one({"operacion_id": op_id}, sort=[("numero", -1)])
    return doc


async def _enviar_y_seguir(op_id: str) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    prov = proveedor(op["proveedor"])
    if prov is None:
        await ops.marcar_fallida(op_id, "El proveedor no está configurado.")
        return

    # Idempotencia: si ya hay un intento con esta clave, no se envía otra vez.
    ya = await db.intentos.find_one({"clave_idempotencia": op["clave_idempotencia"]})
    if ya and ya.get("id_remoto"):
        await ops.guardar_estado(op_id, EstadoOperacion.en_curso.value)
        await _seguir(op_id, ya["id_remoto"])
        return

    numero = int(op.get("intentos") or 0) + 1
    intento = Intento(
        operacion_id=op_id,
        numero=numero,
        proveedor=op["proveedor"],
        clave_idempotencia=op["clave_idempotencia"],
    )
    doc = intento.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.intentos.insert_one(doc)
    await db.operaciones.update_one({"_id": op_id}, {"$set": {"intentos": numero}})

    entradas = EntradaOperacion(**op["entradas"])
    await ops.guardar_estado(op_id, EstadoOperacion.enviada.value)
    try:
        id_remoto = await prov.enviar(entradas, op["clave_idempotencia"])
    except SinRespuesta as e:
        await db.intentos.update_one(
            {"_id": doc["id"]},
            {"$set": {"estado": "incierta", "error": str(e), "id_remoto": e.id_remoto}},
        )
        await ops.guardar_estado(
            op_id,
            EstadoOperacion.incierta.value,
            {"error": f"{e} Comprueba desde el registro; no se reenvía nada solo."},
        )
        return
    except ErrorProveedor as e:
        await _proponer_siguiente_proveedor(op, doc["id"], str(e))
        return
    except Exception as e:  # noqa: BLE001
        await db.intentos.update_one(
            {"_id": doc["id"]}, {"$set": {"estado": "fallida", "error": str(e), "fin": ahora()}}
        )
        await ops.guardar_estado(
            op_id, EstadoOperacion.fallida.value, {"error": f"No se ha podido enviar: {e}"}
        )
        return

    await db.intentos.update_one(
        {"_id": doc["id"]}, {"$set": {"id_remoto": id_remoto, "estado": "en_curso"}}
    )
    await ops.guardar_estado(op_id, EstadoOperacion.en_curso.value)
    await _seguir(op_id, id_remoto)


async def _proponer_siguiente_proveedor(op: dict[str, Any], intento_id: str, motivo: str) -> None:
    """§9.4: si el proveedor falla ANTES de enviar, se propone el siguiente con
    su coste y hay que autorizar otra vez. Nunca se cambia en silencio."""
    modelo = cat.modelo(op["modelo"])
    descartados = tuple(op.get("proveedores_descartados") or ()) + (op["proveedor"],)
    siguiente = cat.proveedor_de(modelo, descartados) if modelo else None
    await db.intentos.update_one(
        {"_id": intento_id}, {"$set": {"estado": "fallida", "error": motivo, "fin": ahora()}}
    )
    if siguiente is None:
        await ops.guardar_estado(
            op["id"],
            EstadoOperacion.fallida.value,
            {"error": f"{motivo} No queda ningún proveedor configurado para este modelo."},
        )
        return
    await ops.guardar_estado(
        op["id"],
        EstadoOperacion.presupuestada.value,
        {
            "proveedor": siguiente,
            "proveedores_descartados": list(descartados),
            "autorizada_en": None,
            "error": f"{motivo} Se propone «{siguiente}»: autoriza otra vez con su coste.",
        },
    )


async def _seguir(op_id: str, id_remoto: str, limite_s: float = 120.0) -> None:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    prov = proveedor(op["proveedor"])
    if prov is None:
        return
    esperado = 0.0
    while esperado < limite_s:
        try:
            estado = await prov.consultar(id_remoto)
        except SinRespuesta as e:
            await _incierta(op_id, f"{e} Comprueba desde el registro; no se reenvía nada solo.")
            return
        if estado.estado == EstadoRemotoNombre.completado:
            await completar(op_id, list(estado.urls), estado.coste_real)
            return
        if estado.estado == EstadoRemotoNombre.fallido:
            intento = await _intento_actual(op_id)
            if intento:
                await db.intentos.update_one(
                    {"_id": intento["_id"]},
                    {"$set": {"estado": "fallida", "error": estado.error, "fin": ahora()}},
                )
            await ops.guardar_estado(
                op_id,
                EstadoOperacion.fallida.value,
                {"error": estado.error or "El proveedor ha devuelto un error."},
            )
            return
        await asyncio.sleep(0.4)
        esperado += 0.4
    await _incierta(op_id, "El seguimiento ha tardado demasiado. Comprueba desde el registro.")


async def _incierta(op_id: str, motivo: str) -> None:
    intento = await _intento_actual(op_id)
    if intento:
        await db.intentos.update_one(
            {"_id": intento["_id"]}, {"$set": {"estado": "incierta", "error": motivo}}
        )
    await ops.guardar_estado(op_id, EstadoOperacion.incierta.value, {"error": motivo})


# --- comprobar (§9.4.7) ------------------------------------------------------


async def comprobar(op_id: str) -> dict[str, Any]:
    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    op = sin_id(doc)
    if op["estado"] not in ("incierta", "enviada", "en_curso"):
        return await ops.vista(op)
    intento = await _intento_actual(op_id)
    id_remoto = (intento or {}).get("id_remoto")
    prov = proveedor(op["proveedor"])
    if prov is None:
        raise ValueError("El proveedor de esta operación no está configurado.")
    if not id_remoto:
        # No hubo respuesta al enviar y no hay id_remoto: se vuelve a preguntar con
        # la MISMA clave de idempotencia, así que el proveedor devuelve el trabajo
        # que ya existía. No se crea un segundo envío.
        entradas = EntradaOperacion(**op["entradas"])
        try:
            id_remoto = await prov.enviar(entradas, op["clave_idempotencia"])
        except SinRespuesta as e:
            if not e.id_remoto:
                return await ops.vista(sin_id(await db.operaciones.find_one({"_id": op_id})))
            id_remoto = e.id_remoto
        if intento:
            await db.intentos.update_one(
                {"_id": intento["_id"]}, {"$set": {"id_remoto": id_remoto}}
            )
    try:
        estado = await prov.consultar(id_remoto)
    except SinRespuesta as e:
        await _incierta(op_id, f"{e} Sigue incierta: vuelve a comprobar.")
        return await ops.vista(sin_id(await db.operaciones.find_one({"_id": op_id})))
    if estado.estado == EstadoRemotoNombre.completado:
        await completar(op_id, list(estado.urls), estado.coste_real)
    elif estado.estado == EstadoRemotoNombre.fallido:
        await ops.guardar_estado(
            op_id,
            EstadoOperacion.fallida.value,
            {"error": estado.error or "El proveedor ha devuelto un error."},
        )
    else:
        if op["estado"] != "en_curso":
            await ops.guardar_estado(op_id, EstadoOperacion.en_curso.value)
        asyncio.create_task(_seguir(op_id, id_remoto))
    return await ops.vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


# --- completar: medios y tomas (§9.4.6) --------------------------------------


def _medidas(ruta: Path) -> dict[str, Any]:
    salida = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "stream=width,height:format=duration", "-of", "json", str(ruta),
        ],
        capture_output=True,
        check=False,
    )
    try:
        datos = json.loads(salida.stdout.decode("utf-8", "ignore") or "{}")
    except json.JSONDecodeError:
        return {"ancho": None, "alto": None, "duracion_s": None}
    flujo = (datos.get("streams") or [{}])[0]
    duracion = (datos.get("format") or {}).get("duration")
    return {
        "ancho": int(flujo["width"]) if flujo.get("width") else None,
        "alto": int(flujo["height"]) if flujo.get("height") else None,
        "duracion_s": round(float(duracion), 3) if duracion else None,
    }


async def _crear_medio(espacio_id: str, op_id: str, extension: str, datos: bytes) -> dict[str, Any]:
    medio = Medio(
        espacio_id=espacio_id,
        clase=CLASE_POR_EXTENSION.get(extension, "documento"),
        ruta="",
        mime=mimetypes.types_map.get(extension, "application/octet-stream"),
        nombre_original=f"simulado{extension}",
        origen="generado",
        operacion_id=op_id,
        etiqueta_demo=True,
        hash=hashlib.sha256(datos).hexdigest(),
    )
    medio.ruta = almacen.guardar(espacio_id, medio.id, extension, datos)
    doc = medio.model_dump(mode="json")
    doc.update(_medidas(almacen.ruta_absoluta(doc["ruta"])))
    doc["_id"] = doc["id"]
    await db.medios.insert_one(doc)
    return sin_id(doc)


async def _fichas_usadas(plano: dict[str, Any]) -> dict[str, int]:
    pieza = await db.piezas.find_one({"_id": plano["pieza_id"]})
    entradas = await db.reparto.find(
        {"proyecto_id": pieza["proyecto_id"], "_id": {"$in": plano.get("elementos") or []}}
    ).to_list(200)
    return {e["elemento_id"]: e["version_ficha"] for e in entradas}


async def _revision_guion(plano: dict[str, Any]) -> int:
    guion = await db.guiones.find_one({"pieza_id": plano["pieza_id"]})
    return int((guion or {}).get("revision") or 0)


def _indice_de_url(url: str) -> int:
    nombre = Path(url).stem  # salida-2
    try:
        return int(nombre.split("-")[-1])
    except ValueError:
        return 0


async def completar(op_id: str, urls: list[str], coste_real: Optional[Any]) -> dict[str, Any]:
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    prov = proveedor(op["proveedor"])
    if prov is None:
        return await ops.marcar_fallida(op_id, "El proveedor no está configurado.")
    entradas = EntradaOperacion(**op["entradas"])
    intento = await _intento_actual(op_id)

    medios: list[tuple[int, dict[str, Any]]] = []
    for url in urls:
        datos = await prov.descargar(url)
        extension = Path(url).suffix or ".png"
        medio = await _crear_medio(op["espacio_id"], op_id, extension, datos)
        medios.append((_indice_de_url(url), medio))

    tomas: list[dict[str, Any]] = []
    if op["destino"]["tipo"] == "plano":
        plano = await db.planos.find_one({"_id": op["destino"]["id"]})
        if plano:
            numero = await db.tomas.count_documents(
                {"plano_id": plano["_id"], "es_exploracion": op["es_exploracion"]}
            )
            fichas = await _fichas_usadas(plano)
            revision = await _revision_guion(plano)
            for orden, (indice, medio) in enumerate(medios):
                variante = (
                    entradas.variantes[indice] if indice < len(entradas.variantes) else None
                )
                toma = Toma(
                    plano_id=plano["_id"],
                    medio_id=medio["id"],
                    operacion_id=op_id,
                    numero=numero + orden + 1,
                    fichas_usadas=fichas,
                    revision_guion=revision,
                    es_exploracion=op["es_exploracion"],
                    exploracion=variante,
                    correccion_id=op.get("correccion_id"),
                )
                doc = toma.model_dump(mode="json")
                doc["_id"] = doc["id"]
                await db.tomas.insert_one(doc)
                tomas.append(sin_id(doc))
            if op.get("correccion_id") and tomas and not op["es_exploracion"]:
                await _enlazar_correccion(plano, op["correccion_id"], op_id, tomas[0]["id"])

    fallidas = [
        i for i in range(entradas.n_variantes) if i not in [indice for indice, _ in medios]
    ]
    real = float(coste_real) if coste_real is not None else None
    if intento:
        await db.intentos.update_one(
            {"_id": intento["_id"]},
            {
                "$set": {
                    "estado": "completada",
                    "fin": ahora(),
                    "coste_real": real,
                    "medios_resultado": [m["id"] for _, m in medios],
                }
            },
        )
    await ops.guardar_estado(
        op_id,
        EstadoOperacion.completada.value,
        {
            "coste_real": real,
            "variantes_fallidas": fallidas,
            "error": (
                f"{len(fallidas)} de {entradas.n_variantes} variantes han fallado: "
                "se cobra solo lo producido y puedes reintentarlas sueltas."
                if fallidas
                else None
            ),
        },
    )
    eventos.publicar(
        op["proyecto_id"],
        {"tipo": "tomas", "plano_id": op["destino"]["id"], "tomas": tomas},
    )
    return await ops.vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


async def _enlazar_correccion(
    plano: dict[str, Any], correccion_id: str, op_id: str, toma_id: str
) -> None:
    """La corrección guarda qué operación la ejecuta y qué toma ha salido
    (§7.7d). Se marca «Hecha» sola al elegir esa toma."""
    correcciones = [
        {**c, "operacion_id": op_id, "toma_id": toma_id} if c["id"] == correccion_id else c
        for c in plano.get("correcciones") or []
    ]
    await db.planos.update_one(
        {"_id": plano["_id"]}, {"$set": {"correcciones": correcciones, "updated_at": ahora()}}
    )


# --- al arrancar (§9.4: nunca se reenvía nada) -------------------------------


async def retomar() -> None:
    pendientes = await db.operaciones.find(
        {"estado": {"$in": ["autorizada", "enviada", "en_curso"]}}
    ).to_list(500)
    for doc in pendientes:
        intento = await _intento_actual(doc["_id"])
        id_remoto = (intento or {}).get("id_remoto")
        if id_remoto:
            asyncio.create_task(_seguir(doc["_id"], id_remoto))
            continue
        try:
            await ops.guardar_estado(
                doc["_id"],
                EstadoOperacion.incierta.value,
                {
                    "error": "El estudio se reinició antes de confirmar el envío. "
                    "Comprueba desde el registro; no se reenvía nada solo.",
                },
            )
        except estados.TransicionNoPermitida:
            continue
