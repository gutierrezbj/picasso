"""Asistente real con OpenAI (§9.7, §6.5). Responses API.

Verificado en developers.openai.com/api/docs/pricing el 15-10-2026:
gpt-6.1-sol a 2,00 $ por millón de tokens de entrada y 10,00 $ de salida.
"""
from __future__ import annotations

import os
from decimal import Decimal

import httpx

MODELO = "gpt-6.1-sol"
PRECIO_ENTRADA = Decimal("2.00") / Decimal(1_000_000)
PRECIO_SALIDA = Decimal("10.00") / Decimal(1_000_000)
URL = "https://api.openai.com/v1/responses"


class AsistenteNoDisponible(RuntimeError):
    pass


async def completar(instrucciones: str, entrada: str) -> tuple[str, Decimal]:
    clave = os.environ.get("OPENAI_API_KEY")
    if not clave:
        raise AsistenteNoDisponible("Falta OPENAI_API_KEY: el asistente real no está configurado.")
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, read=90.0)) as cliente:
        r = await cliente.post(
            URL,
            headers={"Authorization": f"Bearer {clave}"},
            json={"model": MODELO, "instructions": instrucciones, "input": entrada},
        )
    if r.status_code >= 400:
        raise AsistenteNoDisponible(f"OpenAI ha rechazado la petición ({r.status_code}): {r.text[:300]}")
    datos = r.json()
    texto = "".join(
        c.get("text", "")
        for item in datos.get("output") or []
        if item.get("type") == "message"
        for c in item.get("content") or []
        if c.get("type") == "output_text"
    )
    uso = datos.get("usage") or {}
    coste = (
        Decimal(uso.get("input_tokens") or 0) * PRECIO_ENTRADA
        + Decimal(uso.get("output_tokens") or 0) * PRECIO_SALIDA
    )
    return texto, coste
