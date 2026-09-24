from __future__ import annotations

from pathlib import Path

import yaml

from app.config import DATA_DIR_YAML

_RUTA = DATA_DIR_YAML / "recorridos.yaml"


def cargar() -> dict:
    return yaml.safe_load(Path(_RUTA).read_text(encoding="utf-8"))


RECORRIDOS = cargar()


def tipos_resumen() -> list[dict]:
    salida = []
    for tipo, r in RECORRIDOS.items():
        salida.append(
            {
                "tipo": tipo,
                "nombre": r["nombre"],
                "descripcion": r["descripcion"],
                "num_pasos": len(r["pasos"]),
            }
        )
    return salida


def calcular(proyecto: dict, completado: dict | None = None) -> dict:
    """Devuelve los pasos del recorrido con su estado derivado y el paso actual.

    En Fase 1 no hay forma de completar pasos: `completado` llega vacío.
    Estados: listo | en_curso | pendiente | bloqueado | no_hace_falta.
    """
    recorrido = RECORRIDOS[proyecto["tipo"]]
    pasos = recorrido["pasos"]
    omitidos = set(proyecto.get("pasos_omitidos", []))
    completado = completado or {}

    pasos_estado = []
    paso_actual = None
    bloqueo = False

    for p in pasos:
        clave = p["clave"]
        listo = bool(completado.get(clave, False)) and clave not in omitidos
        if clave in omitidos:
            estado = "no_hace_falta"
        elif listo:
            estado = "listo"
        elif bloqueo:
            estado = "bloqueado"
        elif paso_actual is None:
            estado = "en_curso"
            paso_actual = clave
        else:
            estado = "pendiente"

        if p.get("obligatorio", False) and not listo and clave not in omitidos:
            bloqueo = True

        pasos_estado.append({**p, "estado": estado})

    total = len(pasos)
    indice = next((i for i, p in enumerate(pasos) if p["clave"] == paso_actual), None)
    if paso_actual is not None and indice is not None:
        nombre_actual = pasos[indice]["nombre"]
        progreso = f"Paso {indice + 1} de {total} · {nombre_actual}"
    else:
        progreso = f"{total} de {total} · Completado"

    return {
        "tipo": proyecto["tipo"],
        "nombre_recorrido": recorrido["nombre"],
        "pasos": pasos_estado,
        "paso_actual": paso_actual,
        "progreso": progreso,
    }


def ruta_paso(proyecto_id: str, paso: dict) -> str:
    pantalla = paso["pantalla"]
    if pantalla == "idea":
        return f"/p/{proyecto_id}/idea"
    if pantalla == "elementos":
        return f"/p/{proyecto_id}/paso/{paso['clave']}"
    if pantalla == "guion":
        return f"/p/{proyecto_id}/guion"
    if pantalla == "lienzo":
        return f"/p/{proyecto_id}/lienzo"
    if pantalla == "montaje":
        return f"/p/{proyecto_id}/montaje"
    return f"/p/{proyecto_id}/paso/{paso['clave']}"


def ubicacion_por_defecto(proyecto: dict) -> str:
    recorrido = RECORRIDOS[proyecto["tipo"]]
    primer = recorrido["pasos"][0]
    return ruta_paso(proyecto["id"], primer)
