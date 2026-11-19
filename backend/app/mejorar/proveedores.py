from __future__ import annotations

import asyncio
import hashlib
import os
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx

URL = "https://api.openai.com/v1/responses"
LATENCIA_S = float(os.environ.get("LATENCIA_SIMULADO_S") or 1.2)


@dataclass
class RespuestaRemota:
    estado: str
    usage: Any = None
    texto: Optional[str] = None
    motivo: Optional[str] = None
    error: Optional[str] = None


class Rechazo(Exception):
    def __init__(self, mensaje: str, usage: Any = None):
        super().__init__(mensaje)
        self.usage = usage


class SinRespuesta(Exception):
    def __init__(self, mensaje: str, id_remoto: Optional[str] = None):
        super().__init__(mensaje)
        self.id_remoto = id_remoto


class NoEncontrada(Exception):
    pass


def _texto_salida(datos: dict[str, Any]) -> str:
    return "".join(
        c.get("text", "")
        for item in datos.get("output") or []
        if item.get("type") == "message"
        for c in item.get("content") or []
        if c.get("type") == "output_text"
    )


def _respuesta(datos: dict[str, Any]) -> RespuestaRemota:
    return RespuestaRemota(
        estado=str(datos.get("status") or ""),
        usage=datos.get("usage"),
        texto=_texto_salida(datos),
        motivo=(datos.get("incomplete_details") or {}).get("reason"),
        error=((datos.get("error") or {}).get("message") if isinstance(datos.get("error"), dict) else None),
    )


class ProveedorOpenAITexto:
    id = "openai_texto"

    def __init__(self) -> None:
        self.envios = 0

    def _clave(self) -> str:
        clave = os.environ.get("OPENAI_API_KEY")
        if not clave:
            raise Rechazo("Falta OPENAI_API_KEY: el proveedor real no está configurado.")
        return clave

    async def crear(self, entrada: dict[str, Any], configuracion: dict[str, Any], simulacion: str) -> str:
        clave = self._clave()
        cuerpo = {
            "model": configuracion["modelo"],
            "instructions": entrada["instrucciones"],
            "input": entrada["mensaje"],
            "max_output_tokens": configuracion["max_output_tokens"],
            "reasoning": configuracion["reasoning"],
            "prompt_cache_options": configuracion["prompt_cache_options"],
            "background": configuracion["background"],
            "store": configuracion["store"],
        }
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, read=60.0)) as cliente:
                self.envios += 1
                r = await cliente.post(URL, headers={"Authorization": f"Bearer {clave}"}, json=cuerpo)
        except httpx.ConnectError as e:
            raise Rechazo(f"No se pudo conectar con OpenAI; la petición no llegó a enviarse: {e}") from e
        except httpx.HTTPError as e:
            raise SinRespuesta(f"OpenAI no contestó al crear la respuesta: {e}") from e
        if r.status_code >= 500:
            raise SinRespuesta(f"OpenAI devolvió {r.status_code} al crear la respuesta: no demuestra que no se procesara.")
        try:
            datos = r.json()
        except ValueError as e:
            raise SinRespuesta("OpenAI contestó sin un cuerpo legible al crear la respuesta.") from e
        if r.status_code >= 400:
            mensaje = ((datos.get("error") or {}).get("message") if isinstance(datos.get("error"), dict) else None) or r.text[:300]
            raise Rechazo(f"OpenAI rechazó la petición ({r.status_code}): {mensaje}", usage=datos.get("usage"))
        if not datos.get("id"):
            raise SinRespuesta("OpenAI contestó sin identificador de respuesta.")
        return str(datos["id"])

    async def consultar(self, id_remoto: str) -> RespuestaRemota:
        clave = self._clave()
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, read=60.0)) as cliente:
                r = await cliente.get(f"{URL}/{id_remoto}", headers={"Authorization": f"Bearer {clave}"})
        except httpx.HTTPError as e:
            raise SinRespuesta(f"OpenAI no contestó a la consulta: {e}", id_remoto) from e
        if r.status_code == 404:
            raise NoEncontrada("OpenAI no encuentra la respuesta: caducada o no encontrada.")
        if r.status_code >= 400:
            raise SinRespuesta(f"OpenAI devolvió {r.status_code} a la consulta.", id_remoto)
        try:
            return _respuesta(r.json())
        except ValueError as e:
            raise SinRespuesta("OpenAI contestó a la consulta sin un cuerpo legible.", id_remoto) from e


@dataclass
class _Trabajo:
    id_remoto: str
    entrada: dict[str, Any]
    configuracion: dict[str, Any]
    simulacion: str
    creado: float = field(default_factory=time.monotonic)


def _propuesta_simulada(texto: str) -> str:
    import json

    nuevo = (
        f"{texto.rstrip('.')}. Plano medio a la altura de los ojos, objetivo de 50 mm. "
        "Luz natural de una ventana lateral, suave. Tono sereno. Foto realista de 35 mm, piel con textura natural."
    )
    return json.dumps(
        {
            "texto": nuevo,
            "cambios": [
                {"parte": "cámara", "motivo": "Faltaba el tamaño de plano y la óptica."},
                {"parte": "luz", "motivo": "La luz se describe por su fuente."},
                {"parte": "estilo", "motivo": "Se concreta un estilo realista."},
            ],
        },
        ensure_ascii=False,
    )


def _usage(entrada: int, salida: int, razonamiento: int = 200, **extra: Any) -> dict[str, Any]:
    det_e = {"cached_tokens": 0, "cache_write_tokens": 0}
    det_e.update(extra.pop("det_e", {}))
    u = {
        "input_tokens": entrada,
        "input_tokens_details": det_e,
        "output_tokens": salida,
        "output_tokens_details": {"reasoning_tokens": razonamiento},
        "total_tokens": entrada + salida,
    }
    u.update(extra)
    return u


class ProveedorTextoSimulado:
    id = "simulado"

    def __init__(self) -> None:
        self._trabajos: dict[str, _Trabajo] = {}
        self.envios = 0

    def plazo(self) -> float:
        return float(os.environ.get("MEJORAR_PLAZO_S") or 900)

    def retenida(self) -> float:
        return float(os.environ.get("MEJORAR_RETENIDA_S") or 8)

    async def crear(self, entrada: dict[str, Any], configuracion: dict[str, Any], simulacion: str) -> str:
        self.envios += 1
        if simulacion == "rechazada":
            raise Rechazo("El modelo simulado rechaza la petición (4xx simulado).")
        if simulacion == "rechazada_con_consumo":
            raise Rechazo("El modelo simulado rechaza la petición (4xx simulado con consumo).", usage=_usage(120, 0, 0))
        if simulacion == "error_5xx":
            raise SinRespuesta("OpenAI simulado devolvió 503 al crear la respuesta: no demuestra que no se procesara.")
        id_remoto = "resp_sim_" + hashlib.sha256(f"{time.time_ns()}:{entrada['mensaje']}".encode()).hexdigest()[:20]
        self._trabajos[id_remoto] = _Trabajo(id_remoto, entrada, configuracion, simulacion)
        if simulacion == "incierta_sin_id":
            raise SinRespuesta("La creación no contestó (simulado): no llegó el identificador.")
        return id_remoto

    async def consultar(self, id_remoto: str) -> RespuestaRemota:
        t = self._trabajos.get(id_remoto)
        if t is None or t.simulacion == "caducada":
            raise NoEncontrada("OpenAI no encuentra la respuesta: caducada o no encontrada (simulado).")
        transcurrido = time.monotonic() - t.creado
        if t.simulacion == "incierta" and transcurrido < self.plazo() + 0.5:
            raise SinRespuesta("La consulta devolvió 503 (simulado).", id_remoto)
        if t.simulacion == "sin_final":
            return RespuestaRemota(estado="in_progress")
        if t.simulacion == "retenida" and transcurrido < self.retenida():
            return RespuestaRemota(estado="in_progress")
        if transcurrido < LATENCIA_S:
            return RespuestaRemota(estado="queued" if transcurrido < LATENCIA_S / 2 else "in_progress")
        await asyncio.sleep(0)
        return self._final(t)

    def _final(self, t: _Trabajo) -> RespuestaRemota:
        base_entrada = max(1, t.entrada["bytes"] // 4)
        propuesta = _propuesta_simulada(t.entrada["texto"])
        s = t.simulacion
        maximo = int(t.configuracion["max_output_tokens"])
        if s.startswith("incompleta"):
            motivo = {
                "incompleta": "max_output_tokens",
                "incompleta_filtro": "content_filter",
                "incompleta_mensajes": "max_messages",
                "incompleta_steered": "steered",
                "incompleta_desconocida": "motivo_nuevo",
            }[s]
            salida = maximo if motivo == "max_output_tokens" else 300
            return RespuestaRemota(estado="incomplete", usage=_usage(base_entrada, salida, min(salida, 1500)), texto=propuesta[: len(propuesta) // 2], motivo=motivo)
        if s == "supera_reserva":
            return RespuestaRemota(estado="completed", usage=_usage(t.entrada["bytes"] * 3, maximo, 1200), texto=propuesta)
        if s == "escritura_cache":
            return RespuestaRemota(
                estado="completed",
                usage=_usage(base_entrada, 600, det_e={"cache_write_tokens": base_entrada, "cache_write_tokens_details": {"ttl_30m_tokens": base_entrada, "ttl_12h_tokens": 0}}),
                texto=propuesta,
            )
        if s == "sin_consumo":
            return RespuestaRemota(estado="completed", usage=None, texto=propuesta)
        if s == "consumo_nulo":
            return RespuestaRemota(estado="completed", usage={"input_tokens": None, "output_tokens": None, "total_tokens": None}, texto=propuesta)
        if s == "consumo_cero":
            return RespuestaRemota(estado="completed", usage=_usage(0, 0, 0), texto=propuesta)
        if s == "consumo_negativo":
            u = _usage(base_entrada, 600)
            u["output_tokens"] = -5
            return RespuestaRemota(estado="completed", usage=u, texto=propuesta)
        if s == "sin_cuadrar":
            u = _usage(base_entrada, 600)
            u["total_tokens"] = base_entrada + 600 + 200
            return RespuestaRemota(estado="completed", usage=u, texto=propuesta)
        if s == "fallida_sin_consumo":
            return RespuestaRemota(estado="failed", usage=None, error="El modelo simulado falló sin informar consumo.")
        if s == "ilegible":
            return RespuestaRemota(estado="completed", usage=_usage(base_entrada, 400), texto="Aquí tienes una versión mejor, pero sin JSON.")
        return RespuestaRemota(estado="completed", usage=_usage(base_entrada, 600), texto=propuesta)


_REAL = ProveedorOpenAITexto()
_SIMULADO = ProveedorTextoSimulado()


def elegir() -> str:
    return "openai_texto" if os.environ.get("OPENAI_API_KEY") else "simulado"


def proveedor(proveedor_id: str):
    return _REAL if proveedor_id == "openai_texto" else _SIMULADO
