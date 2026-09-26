"""Estados en vivo por SSE (§15.1). Un canal por proyecto; el worker publica y
`GET /api/eventos` reparte. Sin Redis: cola en memoria del propio proceso."""
from __future__ import annotations

import asyncio
from typing import Any

_suscriptores: dict[str, list[asyncio.Queue[dict[str, Any]]]] = {}


def suscribir(proyecto_id: str) -> asyncio.Queue[dict[str, Any]]:
    cola: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
    _suscriptores.setdefault(proyecto_id, []).append(cola)
    return cola


def cancelar(proyecto_id: str, cola: asyncio.Queue[dict[str, Any]]) -> None:
    colas = _suscriptores.get(proyecto_id) or []
    if cola in colas:
        colas.remove(cola)
    if not colas:
        _suscriptores.pop(proyecto_id, None)


def publicar(proyecto_id: str, evento: dict[str, Any]) -> None:
    for cola in list(_suscriptores.get(proyecto_id) or []):
        if not cola.full():
            cola.put_nowait(evento)
