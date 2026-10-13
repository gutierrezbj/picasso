"""Vista previa del prompt (§8). Se construye con una plantilla, sin llamar a
ningún modelo: dirección + rasgos fijos y variables de las fichas usadas +
intención y premisa del desarrollo. Nunca se piden textos ni rótulos.
"""
from __future__ import annotations

import re
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


USO_REFERENCIA: dict[str | None, str] = {
    "personaje": "referencia de identidad de {nombre}: conserva exactamente su cara, pelo, tono de piel y complexión; no copies la pose, la ropa ni el fondo de la foto",
    "producto": "referencia del producto {nombre}: conserva envase, logo, forma, color y material",
    "objeto": "referencia del objeto {nombre}: conserva forma, color y material",
    "escenario": "referencia del lugar {nombre}: conserva arquitectura, materiales y luz del sitio",
    "toma": "imagen de partida del plano: respeta su composición, sus personajes y su luz",
    None: "referencia de estilo y ambiente: úsala solo como guía visual; no copies personas ni textos",
}


def _numeros(lista: list[int]) -> str:
    if len(lista) == 1:
        return f"la imagen {lista[0]}"
    return "las imágenes " + ", ".join(str(n) for n in lista[:-1]) + f" y {lista[-1]}"


def _referencias(referencias: list[dict]) -> tuple[str, str]:
    """§18.22: qué conservar de cada referencia, numerada en el orden en que
    viaja. §18.20: cláusula de identidad para personas reales."""
    lineas: list[str] = []
    reales: dict[str, list[int]] = {}
    for n, r in enumerate(referencias, start=1):
        uso = USO_REFERENCIA.get(r.get("clase"), USO_REFERENCIA[None]).format(nombre=r.get("nombre") or "")
        vista = f" ({r['rol']})" if r.get("rol") and r["rol"] != "otra" else ""
        lineas.append(f"Imagen {n}{vista}: {uso}.")
        if r.get("persona_real") and r.get("nombre"):
            reales.setdefault(r["nombre"], []).append(n)
    identidad = " ".join(
        f"{nombre} es una persona real: mantén su identidad facial exacta, con sus rasgos, edad y proporciones, tal como aparece en {_numeros(nums)}; no la embellezcas, no la rejuvenezcas y no cambies su cara."
        for nombre, nums in reales.items()
    )
    return "\n".join(lineas), identidad


def _duracion(plano: dict) -> str:
    seg = plano.get("duracion_s")
    return f"{seg:g} s" if seg else ""


def _valores(
    plano: dict, continuidad: list[dict], desarrollo: dict | None, referencias: list[dict]
) -> dict[str, str]:
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
    lineas_referencias, identidad = _referencias(referencias)
    return {
        "referencias": lineas_referencias,
        "identidad": identidad,
        "que_se_muestra": plano.get("que_se_muestra") or "",
        "composicion": d.get("composicion") or "",
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
        "negativos": ", ".join(t for t in (d.get("negativos"), des.get("que_evitar")) if t),
    }


def _une(linea: str, valores: dict[str, str]) -> str:
    """Une la línea sin dobles signos: si el valor ya acaba en . ? o !, no se añade otro."""
    texto = linea.format(**valores)
    return re.sub(r"([.?!])\s*\.", r"\1", texto)


def construir(
    plano: dict,
    continuidad: list[dict],
    desarrollo: dict | None,
    referencias: list[dict] | None = None,
) -> str:
    modalidad = plano.get("modalidad") or "imagen"
    plantilla = PLANTILLAS.get(modalidad) or PLANTILLAS["imagen"]
    valores = _valores(plano, continuidad, desarrollo, referencias or [])
    lineas: list[str] = []
    for linea in plantilla["lineas"]:
        claves = [c for _, c, _, _ in Formatter().parse(linea) if c]
        if claves and not all(valores.get(c) for c in claves):
            continue
        lineas.append(_une(linea, valores))
    return "\n".join(lineas)
