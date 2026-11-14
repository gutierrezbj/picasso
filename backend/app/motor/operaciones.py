"""Ciclo de una operación (§9.4) y dinero del proyecto.

Reglas que no se negocian:
- Nada se envía sin `autorizar` explícito y con la cifra delante.
- Una operación `incierta` NUNCA se reenvía sola: se recupera con `Comprobar`.
- Idempotencia: clave = hash(operacion_id + número de intento + entradas). Antes
  de enviar, el motor busca un intento con esa misma clave; si existe, no envía.
- El original nunca se modifica: cada resultado es un `Medio` nuevo y una `Toma`
  nueva (sin elegir).
- Router: el primer proveedor configurado del modelo. Si falla antes de enviar,
  se propone el siguiente con su coste y hay que autorizar otra vez.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Optional

from app.db import db, sin_id
from app.dominio.modelos import (
    EntradaOperacion,
    EstadoOperacion,
    Operacion,
    ahora,
)
from app.motor import catalogo as cat
from app.motor import estados, eventos

ESTADOS_RESERVA = ("autorizada", "enviada", "en_curso", "incierta")


def clave_idempotencia(operacion_id: str, numero_intento: int, entradas: EntradaOperacion) -> str:
    huella = json.dumps(
        {
            "operacion": operacion_id,
            "intento": numero_intento,
            "entradas": entradas.model_dump(mode="json"),
        },
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(huella.encode("utf-8")).hexdigest()


# --- dinero (§9.4.2 y 3) -----------------------------------------------------


def coste_de(op: dict[str, Any]) -> dict[str, Any]:
    """PIC-02 §2: estimación, reserva e importe informado, sin mezclarlos."""
    estimado = op.get("coste_estimado")
    informado = op.get("coste_informado")
    fuente = op.get("coste_informado_fuente")
    if informado is None and op.get("coste_real") is not None:
        if op.get("proveedor") == "simulado":
            informado, fuente = op["coste_real"], "simulado"
        else:
            fuente = "tarifa_historica"
    estado = op.get("estado")
    if op.get("posible_cargo") and informado is None:
        categoria, contado = "posible_cargo", estimado
        etiqueta = "posible cargo sin confirmar"
    elif informado is not None and (estado == "completada" or fuente == "manual"):
        categoria, contado = "informado", informado
        etiqueta = "informado por el simulado" if fuente == "simulado" else (
            "apuntado a mano" if fuente == "manual" else "informado por el proveedor"
        )
    elif estado == "completada" and fuente == "tarifa_historica":
        categoria, contado = "historico_tarifa", op.get("coste_real")
        etiqueta = "según tarifa (histórico, sin confirmar)"
    elif estado == "completada":
        categoria, contado = "estimado", estimado
        etiqueta = "estimado, sin importe del proveedor"
    elif estado in ESTADOS_RESERVA:
        categoria, contado = "reservado", estimado
        etiqueta = "reservado"
    else:
        categoria, contado, etiqueta = "nada", None, ""
    return {
        "estimado": float(estimado) if estimado is not None else None,
        "informado": float(informado) if informado is not None else None,
        "fuente": fuente,
        "tarifa_verificada_en": op.get("tarifa_verificada_en"),
        "categoria": categoria,
        "contado": float(contado) if contado is not None else None,
        "etiqueta": etiqueta,
    }


async def gasto(proyecto_id: str) -> dict[str, Any]:
    """Gasto del proyecto en capas: informado, estimado (completadas sin importe
    y antiguas por tarifa), reservado y posible cargo sin confirmar."""
    capas = {"informado": 0.0, "estimado": 0.0, "reservado": 0.0, "posible_cargo": 0.0}
    sin_verificar = 0
    for op in await db.operaciones.find({"proyecto_id": proyecto_id}).to_list(5000):
        c = coste_de(op)
        if c["categoria"] == "nada":
            continue
        if c["contado"] is None:
            sin_verificar += 1
            continue
        capa = "estimado" if c["categoria"] == "historico_tarifa" else c["categoria"]
        capas[capa] += c["contado"]
    capas = {k: round(v, 2) for k, v in capas.items()}
    return {**capas, "total": round(sum(capas.values()), 2), "sin_verificar": sin_verificar}


async def presupuesto(proyecto_id: str, coste_estimado: Optional[float]) -> dict[str, Any]:
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    aj = await db.ajustes.find_one({"_id": "global"})
    maximo = (proy or {}).get("presupuesto_max")
    if maximo is None:
        maximo = (aj or {}).get("presupuesto_por_defecto") or None
    detalle = await gasto(proyecto_id)
    restante = None if not maximo else round(float(maximo) - detalle["total"], 2)
    supera = bool(
        restante is not None and coste_estimado is not None and coste_estimado > restante
    )
    return {
        "coste_estimado": coste_estimado,
        "coste_sin_verificar": coste_estimado is None,
        "gasto": detalle,
        "presupuesto_max": float(maximo) if maximo else None,
        "presupuesto_restante": restante,
        "supera_presupuesto": supera,
        "moneda": (aj or {}).get("moneda") or "USD",
    }


# --- crear, editar y autorizar ----------------------------------------------


async def _con_coste(op_doc: dict[str, Any], entradas: EntradaOperacion) -> dict[str, Any]:
    modelo = cat.modelo(entradas.modelo)
    if modelo is None:
        raise ValueError(f"El modelo «{entradas.modelo}» no está en el catálogo.")
    if modelo.plantilla:
        raise ValueError(
            f"«{modelo.id}» es una plantilla del catálogo: rellénala y quita «plantilla» "
            "para poder elegirla."
        )
    if entradas.accion not in modelo.acciones:
        raise ValueError(f"«{modelo.nombre_visible}» no hace «{entradas.accion.value}».")
    proveedor = cat.proveedor_de(modelo, tuple(op_doc.get("proveedores_descartados") or ()))
    if proveedor is None:
        raise ValueError(
            f"«{modelo.nombre_visible}» no tiene ningún proveedor configurado. "
            "Las claves se leen de variables de entorno."
        )
    if modelo.duraciones_s and entradas.accion.value == "generar_video":
        admitidas = list(modelo.duraciones_s)
        if not any(abs((entradas.duracion_s or 0) - d) < 0.001 for d in admitidas):
            texto = ", ".join(f"{d:g}" for d in admitidas)
            raise ValueError(
                f"«{modelo.nombre_visible}» solo admite duraciones de {texto} s. "
                "Elige una de esas."
            )
    if entradas.simular_resultado.value != "normal" and proveedor != "simulado":
        raise ValueError("«Prueba · simular resultado» solo existe con el proveedor simulado.")
    estimado = cat.estimar(modelo, entradas)
    return {
        **op_doc,
        "modelo": modelo.id,
        "accion": entradas.accion.value,
        "proveedor": proveedor,
        "entradas": entradas.model_dump(mode="json"),
        "coste_estimado": float(estimado) if estimado is not None else None,
        "coste_unidad": modelo.coste.unidad,
        "coste_verificado": modelo.coste.verificado,
        "tarifa_verificada_en": modelo.coste.verificado_en,
    }


async def crear_operacion(
    *,
    proyecto_id: str,
    espacio_id: str,
    destino_tipo: str,
    destino_id: str,
    entradas: EntradaOperacion,
    prompt_visible: str,
    correccion_id: Optional[str] = None,
    toma_origen_id: Optional[str] = None,
    es_exploracion: bool = False,
) -> dict[str, Any]:
    op = Operacion(
        proyecto_id=proyecto_id,
        espacio_id=espacio_id,
        destino={"tipo": destino_tipo, "id": destino_id},
        accion=entradas.accion,
        modelo=entradas.modelo,
        entradas=entradas,
        prompt_visible=prompt_visible,
        correccion_id=correccion_id,
        toma_origen_id=toma_origen_id,
        es_exploracion=es_exploracion,
        estado=EstadoOperacion.preparada,
    )
    doc = await _con_coste(op.model_dump(mode="json"), entradas)
    doc["estado"] = EstadoOperacion.presupuestada.value
    doc["clave_idempotencia"] = clave_idempotencia(doc["id"], 1, entradas)
    doc["_id"] = doc["id"]
    await db.operaciones.insert_one(doc)
    return await vista(sin_id(doc))


async def vista(op: dict[str, Any]) -> dict[str, Any]:
    modelo = cat.modelo(op["modelo"])
    return {
        "operacion": op,
        "presupuesto": await presupuesto(op["proyecto_id"], op.get("coste_estimado")),
        "modelo": modelo.model_dump(mode="json") if modelo else None,
    }


async def editar(op_id: str, entradas: EntradaOperacion, prompt_visible: str) -> dict[str, Any]:
    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    estados.exigir(doc["estado"], EstadoOperacion.presupuestada.value)
    nuevo = await _con_coste(sin_id(doc), entradas)
    nuevo["prompt_visible"] = prompt_visible
    nuevo["estado"] = EstadoOperacion.presupuestada.value
    nuevo["clave_idempotencia"] = clave_idempotencia(
        op_id, int(doc.get("intentos") or 0) + 1, entradas
    )
    nuevo["updated_at"] = ahora()
    await db.operaciones.update_one({"_id": op_id}, {"$set": nuevo})
    return await vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


async def guardar_estado(op_id: str, siguiente: str, extra: Optional[dict[str, Any]] = None):
    doc = await db.operaciones.find_one({"_id": op_id})
    estados.exigir(doc["estado"], siguiente)
    cambios: dict[str, Any] = {"estado": siguiente, "updated_at": ahora(), **(extra or {})}
    await db.operaciones.update_one({"_id": op_id}, {"$set": cambios})
    op = sin_id(await db.operaciones.find_one({"_id": op_id}))
    eventos.publicar(op["proyecto_id"], {"tipo": "operacion", "operacion": op})
    return op


async def autorizar(op_id: str, confirmado: bool) -> dict[str, Any]:
    from app.motor import worker

    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    estados.exigir(doc["estado"], EstadoOperacion.autorizada.value)
    presu = await presupuesto(doc["proyecto_id"], doc.get("coste_estimado"))
    if presu["supera_presupuesto"] and not confirmado:
        raise PermissionError(
            "Esta operación supera el presupuesto restante "
            f"({presu['presupuesto_restante']} {presu['moneda']}). Confírmalo para seguir."
        )
    op = await guardar_estado(
        op_id, EstadoOperacion.autorizada.value, {"autorizada_en": ahora(), "error": None}
    )
    await worker.encolar(op)
    return await vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


async def reintentar(op_id: str) -> dict[str, Any]:
    """§9.4.8: intento nuevo, clave nueva y hay que autorizar otra vez."""
    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    estados.exigir(doc["estado"], EstadoOperacion.presupuestada.value)
    entradas = EntradaOperacion(**doc["entradas"])
    numero = int(doc.get("intentos") or 0) + 1
    await guardar_estado(
        op_id,
        EstadoOperacion.presupuestada.value,
        {
            "clave_idempotencia": clave_idempotencia(op_id, numero + 1, entradas),
            "error": None,
            "autorizada_en": None,
            "posicion_cola": None,
        },
    )
    return await vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


async def marcar_fallida(op_id: str, motivo: str = "Marcada como fallida a mano.") -> dict[str, Any]:
    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    estados.exigir(doc["estado"], EstadoOperacion.fallida.value)
    ultimo = await db.intentos.find_one({"operacion_id": op_id}, sort=[("numero", -1)])
    if ultimo:
        await db.intentos.update_one(
            {"_id": ultimo["_id"]},
            {"$set": {"estado": "fallida", "fin": ahora(), "error": motivo}},
        )
    # Si venía de «incierta», el proveedor pudo cobrar: queda como posible cargo
    # hasta que se revise (PIC-02 §2). Si no, la reserva se libera.
    extra = {"error": motivo}
    if doc["estado"] == EstadoOperacion.incierta.value:
        extra["posible_cargo"] = True
    await guardar_estado(op_id, EstadoOperacion.fallida.value, extra)
    return await vista(sin_id(await db.operaciones.find_one({"_id": op_id})))


async def resolver_cargo(op_id: str, cobrado: bool, importe: Optional[float]) -> dict[str, Any]:
    doc = await db.operaciones.find_one({"_id": op_id})
    if not doc:
        raise LookupError("Operación no encontrada")
    if not doc.get("posible_cargo"):
        raise PermissionError("Esta operación no tiene un posible cargo pendiente.")
    if cobrado:
        if importe is None or importe < 0:
            raise ValueError("Indica el importe cobrado.")
        cambios = {"posible_cargo": False, "coste_informado": float(importe), "coste_informado_fuente": "manual"}
    else:
        cambios = {"posible_cargo": False}
    await db.operaciones.update_one({"_id": op_id}, {"$set": {**cambios, "updated_at": ahora()}})
    return await vista(sin_id(await db.operaciones.find_one({"_id": op_id})))
