from __future__ import annotations

from pathlib import Path

import yaml
from fastapi import APIRouter

from app.config import DATA_DIR_YAML

router = APIRouter(prefix="/api", tags=["formatos"])

_RUTA = DATA_DIR_YAML / "formatos_semilla.yaml"
_FORMATOS = yaml.safe_load(Path(_RUTA).read_text(encoding="utf-8"))


@router.get("/formatos")
async def listar_formatos(tipo: str | None = None):
    if tipo:
        return [f for f in _FORMATOS if tipo in f.get("tipos_aplicables", [])]
    return _FORMATOS


def formato_generico(tipo: str) -> dict | None:
    for f in _FORMATOS:
        if tipo in f.get("tipos_aplicables", []) and f.get("origen") == "sistema":
            return f
    return None
