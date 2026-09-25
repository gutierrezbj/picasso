"""Almacén de medios (§15.1). Interfaz `Almacen` + implementación local en
sistema de ficheros bajo `DATA_DIR/media/<espacio>/<medio_id>.<ext>`.
Se define como interfaz para poder cambiar a S3 compatible más adelante."""
from __future__ import annotations

from pathlib import Path
from typing import Protocol

from app.config import config


class Almacen(Protocol):
    def guardar(self, espacio_id: str, medio_id: str, extension: str, datos: bytes) -> str: ...

    def ruta_absoluta(self, ruta: str) -> Path: ...

    def borrar(self, ruta: str) -> None: ...


class AlmacenLocal:
    id = "local"

    def __init__(self, raiz: Path):
        self.raiz = Path(raiz)

    def guardar(self, espacio_id: str, medio_id: str, extension: str, datos: bytes) -> str:
        carpeta = self.raiz / espacio_id
        carpeta.mkdir(parents=True, exist_ok=True)
        nombre = f"{medio_id}{extension}"
        (carpeta / nombre).write_bytes(datos)
        return f"{espacio_id}/{nombre}"

    def ruta_absoluta(self, ruta: str) -> Path:
        return self.raiz / ruta

    def borrar(self, ruta: str) -> None:
        destino = self.raiz / ruta
        if destino.exists():
            destino.unlink()


almacen: Almacen = AlmacenLocal(config.MEDIA_DIR)
