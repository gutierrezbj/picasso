"""Proveedor `fal` (§9.1, §9.7). Primer proveedor real de imagen: Nano Banana Pro.

Verificado en fal.ai el 13-10-2026:
- Cola REST: POST https://queue.fal.run/{modelo} · Authorization: Key $FAL_KEY
  → request_id, status_url, response_url. Estados IN_QUEUE / IN_PROGRESS /
  COMPLETED (con `error` si ha fallado).
- fal-ai/nano-banana-pro (texto) y fal-ai/nano-banana-pro/edit (`image_urls`,
  hasta 14). Salida: images[].url. 0,15 $ por imagen; 4K al doble.

fal no documenta idempotencia en el envío: cada clave se registra en la base
ANTES de enviar y una clave ya registrada nunca se reenvía (§9.4.7).
"""
from __future__ import annotations

import asyncio
import base64
import io
import os
from decimal import Decimal
from typing import Any

import fal_client
import httpx
from PIL import Image

from app.db import db
from app.dominio.modelos import Accion, EntradaOperacion
from app.motor import catalogo as cat
from app.motor.contrato import EstadoRemoto, EstadoRemotoNombre, SinRespuesta

COLA = "https://queue.fal.run"
LADO_REFERENCIA = 2048
SEPARADOR = "|"

PUNTO_DE_LLAMADA: dict[str, dict[str, str]] = {
    "fal-nano-banana-pro": {
        "texto": "fal-ai/nano-banana-pro",
        "edicion": "fal-ai/nano-banana-pro/edit",
        "resolucion": "2K",
    },
    "fal-omnihuman-v15": {
        "hablando": "fal-ai/bytedance/omnihuman/v1.5",
        "resolucion": "720p",
    },
    "fal-kling-avatar-v2-pro": {
        "hablando": "fal-ai/kling-video/ai-avatar/v2/pro",
    },
}

_TIEMPO = httpx.Timeout(30.0, read=120.0)


def _data_uri(ruta: str) -> str:
    with Image.open(ruta) as img:
        img = img.convert("RGB")
        img.thumbnail((LADO_REFERENCIA, LADO_REFERENCIA))
        salida = io.BytesIO()
        img.save(salida, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(salida.getvalue()).decode()


def _prompt_variante(prompt: str, encuadre: str | None, angulo: str | None) -> str:
    lineas = [l for l in prompt.split("\n") if not l.startswith("Encuadre:")]
    partes = []
    if encuadre:
        partes.append(f"Encuadre: {encuadre}.")
    if angulo:
        partes.append(f"Ángulo: {angulo}.")
    if partes:
        lineas.insert(1, " ".join(partes))
    return "\n".join(lineas)


class ProveedorFal:
    id = "fal"
    intervalo_s = 2.0
    limite_s = 300.0

    def _clave(self) -> str:
        return os.environ.get("FAL_KEY") or ""

    def _cabeceras(self) -> dict[str, str]:
        return {"Authorization": f"Key {self._clave()}"}

    def modelos(self) -> list[str]:
        return [m.id for m in cat.catalogo() if self.id in m.proveedores and not m.plantilla]

    def estimar(self, op: EntradaOperacion) -> Decimal | None:
        m = cat.modelo(op.modelo)
        return cat.estimar(m, op) if m else None

    def _encargos(self, op: EntradaOperacion) -> list[tuple[str, dict[str, Any]]]:
        llamada = PUNTO_DE_LLAMADA.get(op.modelo)
        if llamada is None:
            raise ValueError(f"fal no sabe producir el modelo «{op.modelo}».")
        comun: dict[str, Any] = {
            "num_images": 1,
            "output_format": "png",
            "resolution": llamada["resolucion"],
        }
        if op.relacion_aspecto:
            comun["aspect_ratio"] = op.relacion_aspecto
        if op.accion == Accion.editar_imagen:
            cuerpo = {
                **comun,
                "prompt": op.instruccion or "",
                "image_urls": [_data_uri(op.imagen_entrada.ruta)],
            }
            return [(llamada["edicion"], cuerpo)]
        imagenes = [_data_uri(r.ruta) for r in op.referencias]
        destino = llamada["edicion"] if imagenes else llamada["texto"]
        prompts = (
            [_prompt_variante(op.prompt or "", v.encuadre, v.angulo) for v in op.variantes]
            if op.variantes
            else [op.prompt or ""] * max(1, op.n_variantes)
        )
        encargos = []
        for texto in prompts:
            cuerpo = {**comun, "prompt": texto}
            if imagenes:
                cuerpo["image_urls"] = imagenes
            encargos.append((destino, cuerpo))
        return encargos

    async def _hablando(self, op: EntradaOperacion) -> list[tuple[str, dict[str, Any]]]:
        """OmniHuman 1.5 (§9.7): foto + audio subidos al almacén de fal."""
        llamada = PUNTO_DE_LLAMADA.get(op.modelo) or {}
        if "hablando" not in llamada:
            raise ValueError(f"fal no sabe hacer hablar con el modelo «{op.modelo}».")
        os.environ.setdefault("FAL_KEY", self._clave())
        foto = await fal_client.upload_file_async(op.retrato.ruta)
        audio = await fal_client.upload_file_async(op.audio_entrada.ruta)
        cuerpo: dict[str, Any] = {"image_url": foto, "audio_url": audio}
        if llamada.get("resolucion"):
            cuerpo["resolution"] = llamada["resolucion"]
        if op.prompt:
            cuerpo["prompt"] = op.prompt
        return [(llamada["hablando"], cuerpo)]

    async def enviar(self, op: EntradaOperacion, clave_idempotencia: str) -> str:
        previo = await db.envios_fal.find_one({"_id": clave_idempotencia})
        if previo:
            if previo.get("id_remoto"):
                return previo["id_remoto"]
            raise SinRespuesta(
                "Este envío ya se intentó y fal no contestó. No se reenvía para no cobrar dos veces."
            )
        encargos = (
            await self._hablando(op)
            if op.accion == Accion.personaje_hablando
            else self._encargos(op)
        )
        await db.envios_fal.insert_one({"_id": clave_idempotencia, "id_remoto": None})
        respuestas: list[str] = []
        async with httpx.AsyncClient(timeout=_TIEMPO) as cliente:
            for destino, cuerpo in encargos:
                try:
                    r = await cliente.post(
                        f"{COLA}/{destino}", headers=self._cabeceras(), json=cuerpo
                    )
                except (httpx.TimeoutException, httpx.TransportError) as e:
                    parcial = SEPARADOR.join(respuestas) or None
                    await db.envios_fal.update_one(
                        {"_id": clave_idempotencia}, {"$set": {"id_remoto": parcial}}
                    )
                    raise SinRespuesta(f"fal no ha contestado al envío: {e}", id_remoto=parcial) from e
                if r.status_code >= 400:
                    if respuestas:
                        parcial = SEPARADOR.join(respuestas)
                        await db.envios_fal.update_one(
                            {"_id": clave_idempotencia}, {"$set": {"id_remoto": parcial}}
                        )
                        return parcial
                    await db.envios_fal.delete_one({"_id": clave_idempotencia})
                    raise RuntimeError(f"fal ha rechazado el encargo ({r.status_code}): {r.text[:300]}")
                respuestas.append(r.json()["response_url"])
        id_remoto = SEPARADOR.join(respuestas)
        await db.envios_fal.update_one(
            {"_id": clave_idempotencia}, {"$set": {"id_remoto": id_remoto}}
        )
        return id_remoto

    async def consultar(self, id_remoto: str) -> EstadoRemoto:
        urls_respuesta = id_remoto.split(SEPARADOR)
        imagenes: list[str] = []
        errores: list[str] = []
        pendientes = 0
        async with httpx.AsyncClient(timeout=_TIEMPO) as cliente:
            for indice, url in enumerate(urls_respuesta):
                try:
                    r = await cliente.get(f"{url}/status", headers=self._cabeceras())
                except (httpx.TimeoutException, httpx.TransportError) as e:
                    raise SinRespuesta(f"fal no ha contestado a la consulta: {e}", id_remoto) from e
                if r.status_code >= 400:
                    raise SinRespuesta(f"fal no reconoce el trabajo ({r.status_code}).", id_remoto)
                estado = r.json()
                if estado.get("status") != "COMPLETED":
                    pendientes += 1
                    continue
                if estado.get("error"):
                    errores.append(str(estado["error"]))
                    continue
                try:
                    resultado = await cliente.get(url, headers=self._cabeceras())
                except (httpx.TimeoutException, httpx.TransportError) as e:
                    raise SinRespuesta(f"fal no ha devuelto el resultado: {e}", id_remoto) from e
                if resultado.status_code >= 400:
                    errores.append(resultado.text[:300])
                    continue
                datos = resultado.json()
                for img in datos.get("images") or []:
                    imagenes.append(f"{img['url']}#{indice}")
                if (datos.get("video") or {}).get("url"):
                    imagenes.append(f"{datos['video']['url']}#{indice}")
        if pendientes:
            hechas = len(urls_respuesta) - pendientes
            return EstadoRemoto(
                estado=EstadoRemotoNombre.en_curso, progreso=hechas / len(urls_respuesta)
            )
        if not imagenes:
            return EstadoRemoto(
                estado=EstadoRemotoNombre.fallido,
                error="fal: " + ("; ".join(errores) or "no ha devuelto ninguna imagen."),
            )
        return EstadoRemoto(estado=EstadoRemotoNombre.completado, urls=tuple(imagenes), progreso=1.0)

    async def descargar(self, url: str) -> bytes:
        limpia = url.split("#", 1)[0]
        for intento in range(3):
            try:
                async with httpx.AsyncClient(timeout=_TIEMPO) as cliente:
                    r = await cliente.get(limpia)
                r.raise_for_status()
                return r.content
            except (httpx.TimeoutException, httpx.TransportError):
                if intento == 2:
                    raise
                await asyncio.sleep(2)
        raise RuntimeError("No se ha podido descargar la imagen de fal.")
