"""Vista previa del prompt (§8). Se construye con una plantilla, sin llamar a
ningún modelo: dirección + rasgos fijos y variables de las fichas usadas +
intención y premisa del desarrollo. Nunca se piden textos ni rótulos.
"""
from __future__ import annotations

from pathlib import Path
from string import Formatter

import yaml

from app.config import DATA_DIR_YAML

_RUTA = DATA_DIR_YAML / "plantillas_prompt.yaml"


def plantillas() -> dict:
    return yaml.safe_load(Path(_RUTA).read_text(encoding="utf-8"))


PLANTILLAS = plantillas()


def _luz(d: dict) -> str:
    partes = [d.get("luz_direccion"), d.get("luz_calidad"), d.get("luz_momento")]
    return ", ".join([p for p in partes if p])


def _duracion(plano: dict) -> str:
    seg = plano.get("duracion_s")
    return f"{seg:g} s" if seg else ""


def _valores(plano: dict, continuidad: list[dict], desarrollo: dict | None) -> dict[str, str]:
    d = plano.get("direccion") or {}
    des = desarrollo or {}
    fijos: list[str] = []
    variables: list[str] = []
    for c in continuidad:
        if c["rasgos_fijos"]:
            fijos.append(f"{c['nombre']}: " + "; ".join(c["rasgos_fijos"]))
        if c["rasgos_variables_aplican"]:
            variables.append(f"{c['nombre']}: " + "; ".join(c["rasgos_variables_aplican"]))
    intencion = ". ".join([t for t in (des.get("intencion"), des.get("premisa")) if t])
    return {
        "que_se_muestra": plano.get("que_se_muestra") or "",
        "accion": d.get("accion") or "",
        "encuadre": d.get("encuadre") or "",
        "angulo": d.get("angulo") or "",
        "encuadre_inicio": d.get("encuadre_inicio") or "",
        "angulo_inicio": d.get("angulo_inicio") or "",
        "encuadre_final": d.get("encuadre_final") or "",
        "angulo_final": d.get("angulo_final") or "",
        "movimiento_camara": d.get("movimiento_camara") or "",
        "duracion": _duracion(plano),
        "protagonista_visual": d.get("protagonista_visual") or "",
        "optica": d.get("optica") or "",
        "profundidad_campo": d.get("profundidad_campo") or "",
        "luz": _luz(d),
        "temperatura_color": d.get("temperatura_color") or "",
        "ambiente": d.get("ambiente") or "",
        "acabado": d.get("acabado") or "",
        "elementos": ", ".join(c["nombre"] for c in continuidad),
        "rasgos_fijos": " · ".join(fijos),
        "rasgos_variables": " · ".join(variables),
        "intencion_pieza": intencion,
        "negativos": d.get("negativos") or "",
    }


def construir(plano: dict, continuidad: list[dict], desarrollo: dict | None) -> str:
    modalidad = plano.get("modalidad") or "imagen"
    plantilla = PLANTILLAS.get(modalidad) or PLANTILLAS["imagen"]
    valores = _valores(plano, continuidad, desarrollo)
    lineas: list[str] = []
    for linea in plantilla["lineas"]:
        claves = [c for _, c, _, _ in Formatter().parse(linea) if c]
        if claves and not all(valores.get(c) for c in claves):
            continue
        lineas.append(linea.format(**valores))
    return "\n".join(lineas)
