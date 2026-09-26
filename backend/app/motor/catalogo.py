"""Catálogo de modelos (§9.3), en `backend/data/catalogo_modelos.yaml`.

Se valida al arrancar: una acción desconocida, un proveedor que no existe o una
unidad de coste inválida impiden arrancar con un error que dice qué entrada
falla. Nada se ignora en silencio.
"""
from __future__ import annotations

import os
from decimal import Decimal
from pathlib import Path
from typing import Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.config import DATA_DIR_YAML
from app.dominio.modelos import Accion, EntradaOperacion

_RUTA = DATA_DIR_YAML / "catalogo_modelos.yaml"

# Clave de entorno que necesita cada proveedor (§9.1). El simulado no necesita.
CLAVES_PROVEEDOR: dict[str, str] = {
    "simulado": "",
    "fal": "FAL_KEY",
    "kie": "KIE_API_KEY",
    "openai_images": "OPENAI_API_KEY",
    "elevenlabs": "ELEVENLABS_API_KEY",
}

UNIDADES = ("imagen", "segundo", "caracter", "operacion")


class ErrorCatalogo(RuntimeError):
    pass


class Coste(BaseModel):
    model_config = ConfigDict(frozen=True)

    unidad: str
    valor: Optional[Decimal] = None
    moneda: str = "USD"
    verificado: bool = False


class Admite(BaseModel):
    model_config = ConfigDict(frozen=True)

    primer_fotograma: bool = False
    ultimo_fotograma: bool = False
    referencias: int = 0
    audio: bool = False


class Formato(BaseModel):
    """Cómo sale el fichero del proveedor simulado (formatos variados a propósito)."""

    model_config = ConfigDict(frozen=True)

    fps: int = 25
    lado_largo: int = 1280
    png_lado_largo: int = 1280
    hz: int = 48000


class ModeloCatalogo(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    nombre_visible: str
    acciones: tuple[Accion, ...] = ()
    proveedores: tuple[str, ...] = ()
    admite: Admite = Field(default_factory=Admite)
    duraciones_s: tuple[float, ...] = ()
    relaciones: tuple[str, ...] = ()
    coste: Coste
    formato: Formato = Field(default_factory=Formato)
    plantilla: bool = False
    nota: Optional[str] = None


def _leer() -> list[ModeloCatalogo]:
    crudo = yaml.safe_load(Path(_RUTA).read_text(encoding="utf-8")) or []
    modelos: list[ModeloCatalogo] = []
    vistos: set[str] = set()
    for i, entrada in enumerate(crudo):
        donde = f"catalogo_modelos.yaml · entrada {i + 1} (id «{(entrada or {}).get('id')}»)"
        try:
            m = ModeloCatalogo(**entrada)
        except ValidationError as e:
            raise ErrorCatalogo(f"{donde}: {e.errors()[0]['loc']} → {e.errors()[0]['msg']}") from e
        if m.id in vistos:
            raise ErrorCatalogo(f"{donde}: el id está repetido.")
        vistos.add(m.id)
        if not m.acciones:
            raise ErrorCatalogo(f"{donde}: no declara ninguna acción.")
        if not m.proveedores:
            raise ErrorCatalogo(f"{donde}: no declara ningún proveedor.")
        for p in m.proveedores:
            if p not in CLAVES_PROVEEDOR:
                raise ErrorCatalogo(f"{donde}: el proveedor «{p}» no existe.")
        if m.coste.unidad not in UNIDADES:
            raise ErrorCatalogo(
                f"{donde}: unidad de coste «{m.coste.unidad}» inválida. Usa una de {UNIDADES}."
            )
        if m.coste.moneda != "USD":
            raise ErrorCatalogo(f"{donde}: la moneda solo puede ser USD (§9.4).")
        modelos.append(m)
    return modelos


_MODELOS: list[ModeloCatalogo] = _leer()


def proveedor_configurado(proveedor_id: str) -> bool:
    clave = CLAVES_PROVEEDOR.get(proveedor_id)
    if clave is None:
        return False
    return not clave or bool(os.environ.get(clave))


def catalogo() -> list[ModeloCatalogo]:
    return list(_MODELOS)


def modelo(modelo_id: str) -> Optional[ModeloCatalogo]:
    return next((m for m in _MODELOS if m.id == modelo_id), None)


def proveedor_de(m: ModeloCatalogo, descartados: tuple[str, ...] = ()) -> Optional[str]:
    """Router (§9.4): el primer proveedor de su lista que esté configurado y no
    se haya descartado en esta operación."""
    return next(
        (p for p in m.proveedores if proveedor_configurado(p) and p not in descartados), None
    )


def elegible(m: ModeloCatalogo) -> bool:
    return not m.plantilla and proveedor_de(m) is not None


def estimar(m: ModeloCatalogo, entradas: EntradaOperacion) -> Optional[Decimal]:
    """Coste estimado según la unidad. `None` = «coste sin verificar»: nunca 0
    por desconocido."""
    valor = m.coste.valor
    if valor is None:
        return None
    unidades = Decimal(1)
    if m.coste.unidad == "imagen":
        unidades = Decimal(max(1, entradas.n_variantes))
    elif m.coste.unidad == "segundo":
        unidades = Decimal(str(entradas.duracion_s or 0))
    elif m.coste.unidad == "caracter":
        unidades = Decimal(len(entradas.texto or ""))
    return (valor * unidades).quantize(Decimal("0.0001"))
