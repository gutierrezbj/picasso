from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


def ahora() -> str:
    return datetime.now(timezone.utc).isoformat()


def nuevo_id() -> str:
    return uuid.uuid4().hex


# --- Vocabulario cerrado (§2). Validado en el borde por estos enums. ---


class TipoEspacio(str, Enum):
    cliente = "cliente"
    marca = "marca"
    propio = "propio"


class TipoProyecto(str, Enum):
    corto = "corto"
    anuncio = "anuncio"
    imagen = "imagen"
    serie = "serie"


class FormatoVideo(str, Enum):
    v9_16 = "9:16"
    v16_9 = "16:9"
    v1_1 = "1:1"
    v4_5 = "4:5"


# --- Espacio ---


class EspacioCrear(BaseModel):
    nombre: str
    tipo_espacio: TipoEspacio
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None


class EspacioEditar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None
    archivado: Optional[bool] = None
    updated_at: str  # esperado, para detectar conflicto (409)


class Espacio(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    nombre: str
    tipo_espacio: TipoEspacio
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None
    archivado: bool = False
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


# --- Proyecto ---


class ProyectoCrear(BaseModel):
    nombre: str
    tipo: TipoProyecto
    formato_video: FormatoVideo


class ProyectoEditar(BaseModel):
    nombre: Optional[str] = None
    formato_video: Optional[FormatoVideo] = None
    duracion_objetivo_s: Optional[int] = None
    presupuesto_max: Optional[float] = None
    pasos_omitidos: Optional[list[str]] = None
    updated_at: str


class Proyecto(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    espacio_id: str
    nombre: str
    tipo: TipoProyecto
    formato_id: Optional[str] = None
    formato_video: FormatoVideo
    duracion_objetivo_s: Optional[int] = None
    presupuesto_max: Optional[float] = None
    pasos_omitidos: list[str] = Field(default_factory=list)
    ultimo_acceso: str = Field(default_factory=ahora)
    ultima_ubicacion: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class Ubicacion(BaseModel):
    ultima_ubicacion: str


# --- Ajustes (global) ---


class Ajustes(BaseModel):
    moneda: str = "USD"
    presupuesto_por_defecto: float = 0.0
    proveedores_habilitados: list[str] = Field(default_factory=list)
    modelo_asistente: str = "claude-sonnet-5"


class AjustesEditar(BaseModel):
    moneda: Optional[str] = None
    presupuesto_por_defecto: Optional[float] = None
    modelo_asistente: Optional[str] = None


# --- Desarrollo (uno por proyecto) ---


class Desarrollo(BaseModel):
    intencion: Optional[str] = None
    publico: Optional[str] = None
    mensaje: Optional[str] = None
    tono: Optional[str] = None
    premisa: Optional[str] = None
    mundo: Optional[str] = None
    arco_general: Optional[str] = None
    notas: Optional[str] = None
    respuestas_formato: dict = Field(default_factory=dict)
    estado: str = "en_curso"  # en_curso | listo


# --- Asistente (§10) ---


class PeticionAsistente(BaseModel):
    campo: Optional[str] = None  # para proponer_campo


class AceptarParte(BaseModel):
    accion: str  # aceptar | descartar
    texto: Optional[str] = None  # texto editado por el usuario al aceptar
