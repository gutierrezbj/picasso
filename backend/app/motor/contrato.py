"""Contrato de proveedor (§9.1). Todo proveedor (el `simulado` hoy, los reales
en la Fase 9) implementa esta interfaz asíncrona. El motor no conoce nada más.

`consultar` solo LEE: nunca crea ni reenvía nada. El estado «incierto» no está
aquí: lo decide el motor cuando enviar o consultar fallan sin respuesta clara.
"""
from __future__ import annotations

from decimal import Decimal
from enum import Enum
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from app.dominio.modelos import EntradaOperacion


class EstadoRemotoNombre(str, Enum):
    en_cola = "en_cola"
    en_curso = "en_curso"
    completado = "completado"
    fallido = "fallido"


class EstadoRemoto(BaseModel):
    model_config = ConfigDict(frozen=True)

    estado: EstadoRemotoNombre
    urls: tuple[str, ...] = ()
    error: str | None = None
    coste_real: Decimal | None = None
    progreso: float | None = None


class SinRespuesta(Exception):
    """El proveedor no ha contestado con claridad. El motor deja la operación
    `incierta`: nunca se reenvía sola (§9.4.7)."""

    def __init__(self, mensaje: str, id_remoto: str | None = None):
        super().__init__(mensaje)
        self.id_remoto = id_remoto


class ErrorProveedor(Exception):
    """El proveedor no acepta el encargo (antes de enviar). El motor propone el
    siguiente proveedor del modelo y pide autorizar otra vez (§9.4)."""


class Proveedor(Protocol):
    id: str

    def modelos(self) -> list[str]: ...

    def estimar(self, op: EntradaOperacion) -> Decimal | None: ...

    async def enviar(self, op: EntradaOperacion, clave_idempotencia: str) -> str: ...

    async def consultar(self, id_remoto: str) -> EstadoRemoto: ...

    async def descargar(self, url: str) -> bytes: ...


class Progreso(BaseModel):
    """Lo que la interfaz necesita saber de un trabajo en marcha."""

    model_config = ConfigDict(frozen=True)

    estado: EstadoRemotoNombre
    progreso: float | None = None
    urls: tuple[str, ...] = Field(default=())
