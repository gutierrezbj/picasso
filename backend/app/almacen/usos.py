"""Dónde se usa un medio (PIC-02 §1). Lo consulta cualquier borrado de medios."""
from __future__ import annotations

from app.db import db

CAMPOS_ENTRADA = (
    "entradas.imagen_entrada.medio_id",
    "entradas.referencias.medio_id",
    "entradas.primer_fotograma.medio_id",
    "entradas.ultimo_fotograma.medio_id",
    "entradas.video_entrada.medio_id",
    "entradas.audio_entrada.medio_id",
    "entradas.retrato.medio_id",
    "taller.referencias",
)


async def usos_de_medio(medio_id: str) -> list[str]:
    usos: list[str] = []
    fichas = await db.fichas.find({"referencias.medio_id": medio_id}).to_list(200)
    if fichas:
        ids = list({f["elemento_id"] for f in fichas})
        elementos = await db.elementos.find({"_id": {"$in": ids}}).to_list(200)
        usos.append("referencia de " + ", ".join(e["nombre"] for e in elementos))
    if await db.pistas_audio.find_one({"medio_id": medio_id}):
        usos.append("música o ambiente de una pieza")
    tomas = await db.tomas.count_documents({"medio_id": medio_id})
    if tomas:
        usos.append(f"{tomas} toma(s)")
    operaciones = await db.operaciones.count_documents(
        {"$or": [{campo: medio_id} for campo in CAMPOS_ENTRADA]}
    )
    if operaciones:
        usos.append(f"entrada de {operaciones} operación(es) del historial")
    return usos
