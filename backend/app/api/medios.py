"""Medios (§3.1, §15.1). El binario va al almacén; la entidad guarda la ruta.
El original nunca se modifica."""
from __future__ import annotations

import hashlib
import io
import mimetypes
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.almacen import almacen
from app.db import db, sin_id
from app.dominio.modelos import ClaseMedio, Medio

router = APIRouter(prefix="/api", tags=["medios"])

MAX_BYTES = 25 * 1024 * 1024

_CLASES_MIME = {
    "image": ClaseMedio.imagen,
    "video": ClaseMedio.video,
    "audio": ClaseMedio.audio,
}
_MIME_DOCUMENTO = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _clase_de(mime: str) -> ClaseMedio:
    prefijo = (mime or "").split("/")[0]
    if prefijo in _CLASES_MIME:
        return _CLASES_MIME[prefijo]
    if mime in _MIME_DOCUMENTO:
        return ClaseMedio.documento
    raise HTTPException(400, f"Tipo de archivo no admitido: {mime or 'desconocido'}")


def _medidas(datos: bytes) -> tuple[int | None, int | None]:
    try:
        from PIL import Image

        with Image.open(io.BytesIO(datos)) as img:
            return img.width, img.height
    except Exception:
        return None, None


@router.get("/espacios/{espacio_id}/medios")
async def listar_medios(espacio_id: str, clase: str | None = None):
    filtro: dict = {"espacio_id": espacio_id}
    if clase:
        filtro["clase"] = clase
    docs = await db.medios.find(filtro).sort("created_at", -1).to_list(2000)
    return [sin_id(d) for d in docs]


@router.post("/espacios/{espacio_id}/medios", status_code=201)
async def subir_medio(
    espacio_id: str,
    archivo: UploadFile = File(...),
    etiqueta: str | None = Form(None),
):
    esp = await db.espacios.find_one({"_id": espacio_id})
    if not esp:
        raise HTTPException(404, "Espacio no encontrado")

    datos = await archivo.read()
    if not datos:
        raise HTTPException(400, "El archivo está vacío.")
    if len(datos) > MAX_BYTES:
        raise HTTPException(413, "El archivo supera los 25 MB.")

    mime = archivo.content_type or mimetypes.guess_type(archivo.filename or "")[0] or ""
    clase = _clase_de(mime)
    extension = Path(archivo.filename or "").suffix or mimetypes.guess_extension(mime) or ""

    medio = Medio(
        espacio_id=espacio_id,
        clase=clase,
        ruta="",
        mime=mime,
        nombre_original=archivo.filename,
        etiqueta=(etiqueta or None),
        origen="importado",
        hash=hashlib.sha256(datos).hexdigest(),
    )
    if clase == ClaseMedio.imagen:
        medio.ancho, medio.alto = _medidas(datos)
    medio.ruta = almacen.guardar(espacio_id, medio.id, extension, datos)
    if clase in (ClaseMedio.audio, ClaseMedio.video):
        # La duración real la necesitan el montaje y el paquete (§11).
        from app.motor.ficheros import duracion_de

        medio.duracion_s = duracion_de(almacen.ruta_absoluta(medio.ruta))

    doc = medio.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.medios.insert_one(doc)
    return sin_id(doc)


@router.get("/medios/{medio_id}/archivo")
async def archivo_medio(medio_id: str):
    doc = await db.medios.find_one({"_id": medio_id})
    if not doc:
        raise HTTPException(404, "Medio no encontrado")
    ruta = almacen.ruta_absoluta(doc["ruta"])
    if not ruta.exists():
        raise HTTPException(404, "El archivo del medio no está en el almacén.")
    return FileResponse(ruta, media_type=doc["mime"], filename=doc.get("nombre_original") or medio_id)


@router.delete("/medios/{medio_id}", status_code=200)
async def borrar_medio(medio_id: str):
    doc = await db.medios.find_one({"_id": medio_id})
    if not doc:
        raise HTTPException(404, "Medio no encontrado")
    usos = await db.fichas.find({"referencias.medio_id": medio_id}).to_list(200)
    if usos:
        ids = list({u["elemento_id"] for u in usos})
        elementos = await db.elementos.find({"_id": {"$in": ids}}).to_list(200)
        nombres = ", ".join(e["nombre"] for e in elementos)
        raise HTTPException(409, f"No se puede borrar: se usa como referencia en {nombres}.")
    if await db.pistas_audio.find_one({"medio_id": medio_id}):
        raise HTTPException(409, "No se puede borrar: se usa como música o ambiente en una pieza.")
    almacen.borrar(doc["ruta"])
    await db.medios.delete_one({"_id": medio_id})
    return {"ok": True}
