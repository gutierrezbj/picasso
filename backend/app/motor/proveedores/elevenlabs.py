"""Proveedor `elevenlabs` (§9.1, §9.7). Voz de los diálogos con la voz de la ficha.

Verificado en elevenlabs.io el 14-10-2026:
- POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id} · cabecera xi-api-key.
  Cuerpo: text, model_id (por defecto eleven_multilingual_v2), voice_settings
  (stability, similarity_boost, style, use_speaker_boost, speed). Devuelve el
  audio (mp3_44100_128 por defecto).
- Precio de la API: 0,08 $ por 1.000 caracteres en Eleven v3 y Multilingual v2.

La llamada es síncrona: `enviar` deja el audio en disco y `consultar` lo da por
completado. Cada clave se registra antes de enviar y nunca se reenvía (§9.4.7).
"""
from __future__ import annotations

import asyncio
import os
import subprocess
from decimal import Decimal
from pathlib import Path

import httpx

from app.config import config
from app.db import db
from app.dominio.modelos import EntradaOperacion
from app.motor import catalogo as cat
from app.motor.contrato import EstadoRemoto, EstadoRemotoNombre, SinRespuesta

API = "https://api.elevenlabs.io/v1/text-to-speech"

MODELO_REMOTO: dict[str, str] = {
    "elevenlabs-multilingual-v2": "eleven_multilingual_v2",
    "elevenlabs-v3": "eleven_v3",
}

AJUSTES = {"stability": float, "similarity_boost": float, "style": float, "speed": float}

_TIEMPO = httpx.Timeout(30.0, read=180.0)


class ProveedorElevenLabs:
    id = "elevenlabs"
    intervalo_s = 0.5
    limite_s = 30.0

    def __init__(self, carpeta: Path | None = None):
        self.carpeta = Path(carpeta or config.DATA_DIR / "elevenlabs")

    def modelos(self) -> list[str]:
        return [m.id for m in cat.catalogo() if self.id in m.proveedores and not m.plantilla]

    def estimar(self, op: EntradaOperacion) -> Decimal | None:
        m = cat.modelo(op.modelo)
        return cat.estimar(m, op) if m else None

    def _wav(self, clave: str) -> Path:
        return self.carpeta / f"{clave}.wav"

    async def enviar(self, op: EntradaOperacion, clave_idempotencia: str) -> str:
        previo = await db.envios_elevenlabs.find_one({"_id": clave_idempotencia})
        if previo:
            if previo.get("hecho"):
                return clave_idempotencia
            raise SinRespuesta(
                "Este envío ya se intentó y ElevenLabs no contestó. No se reenvía para no cobrar dos veces."
            )
        voice_id = (op.voz.voice_id if op.voz else None) or ""
        if not voice_id:
            raise RuntimeError(
                "El hablante no tiene voz: pon el identificador de ElevenLabs en el bloque Voz de su ficha."
            )
        modelo = MODELO_REMOTO.get(op.modelo)
        if modelo is None:
            raise RuntimeError(f"ElevenLabs no sabe producir el modelo «{op.modelo}».")
        cuerpo: dict = {"text": op.texto or "", "model_id": modelo}
        ajustes = {
            k: AJUSTES[k](v) for k, v in ((op.voz.ajustes if op.voz else {}) or {}).items() if k in AJUSTES
        }
        if ajustes:
            cuerpo["voice_settings"] = ajustes
        await db.envios_elevenlabs.insert_one({"_id": clave_idempotencia, "hecho": False})
        try:
            async with httpx.AsyncClient(timeout=_TIEMPO) as cliente:
                r = await cliente.post(
                    f"{API}/{voice_id}",
                    headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY") or ""},
                    json=cuerpo,
                )
        except (httpx.TimeoutException, httpx.TransportError) as e:
            raise SinRespuesta(f"ElevenLabs no ha contestado: {e}") from e
        if r.status_code >= 400:
            await db.envios_elevenlabs.delete_one({"_id": clave_idempotencia})
            raise RuntimeError(f"ElevenLabs ha rechazado el encargo ({r.status_code}): {r.text[:300]}")
        self.carpeta.mkdir(parents=True, exist_ok=True)
        mp3 = self.carpeta / f"{clave_idempotencia}.mp3"
        mp3.write_bytes(r.content)
        await asyncio.to_thread(
            subprocess.run,
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-ar", "44100", str(self._wav(clave_idempotencia))],
            check=True,
        )
        await db.envios_elevenlabs.update_one({"_id": clave_idempotencia}, {"$set": {"hecho": True}})
        return clave_idempotencia

    async def consultar(self, id_remoto: str) -> EstadoRemoto:
        if not self._wav(id_remoto).exists():
            raise SinRespuesta("No está el audio de ElevenLabs de este envío.", id_remoto)
        return EstadoRemoto(
            estado=EstadoRemotoNombre.completado,
            urls=(f"elevenlabs://{id_remoto}/salida-0.wav",),
            progreso=1.0,
        )

    async def descargar(self, url: str) -> bytes:
        id_remoto = url.split("://", 1)[1].split("/", 1)[0]
        return self._wav(id_remoto).read_bytes()
