"""Utilidades comunes de los scripts de prueba.

CERROJO: al importarse comprueba contra qué base de datos apunta la instancia y
aborta si no es la base de pruebas. Ningún script del constructor puede escribir
en la base de la previsualización (la del usuario).
"""
from __future__ import annotations

import os
import sys

import requests

API = os.environ.get("API", "http://localhost:8002").rstrip("/")

PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082"
)


def exigir_pruebas() -> dict:
    try:
        ent = requests.get(f"{API}/api/entorno", timeout=10).json()
    except Exception as e:  # noqa: BLE001
        print(f"ABORTADO · no se puede consultar {API}/api/entorno: {e}")
        sys.exit(2)
    if not ent.get("es_pruebas"):
        print(
            "ABORTADO · esta instancia usa la base "
            f"«{ent.get('db_name')}», que no es la base de pruebas. "
            "Los scripts no escriben nunca fuera de la base de pruebas."
        )
        sys.exit(2)
    return ent


ENTORNO = exigir_pruebas()


def req(metodo: str, ruta: str, cuerpo=None, archivos=None):
    r = requests.request(metodo, f"{API}{ruta}", json=cuerpo, files=archivos, timeout=60)
    try:
        return r.json()
    except Exception:  # noqa: BLE001
        return {"__status": r.status_code, "__raw": r.text[:300]}


def subir_imagen(espacio_id: str, nombre: str = "referencia.png") -> dict:
    return req(
        "POST",
        f"/api/espacios/{espacio_id}/medios",
        archivos={"archivo": (nombre, PNG_1PX, "image/png")},
    )


def elemento_aprobado(espacio_id: str, clase: str, nombre: str) -> dict:
    """Elemento con su ficha v1 aprobada. Personajes y productos exigen imagen (§4.3)."""
    el = req("POST", f"/api/espacios/{espacio_id}/elementos", {"clase": clase, "nombre": nombre})
    ficha = el["fichas"][0]
    referencias = []
    if clase in ("personaje", "producto"):
        medio = subir_imagen(espacio_id, f"{nombre}.png")
        referencias = [{"medio_id": medio["id"], "rol": "frontal"}]
    req(
        "PATCH",
        f"/api/fichas/{ficha['id']}",
        {
            "descripcion": f"{nombre} de las pruebas automáticas",
            "referencias": referencias,
            "updated_at": ficha["updated_at"],
        },
    )
    req("POST", f"/api/fichas/{ficha['id']}/aprobar")
    return el


def semilla() -> dict:
    """Espacio y corto de las pruebas automáticas, con reparto y 3 escenas."""
    esp = req(
        "POST",
        "/api/espacios",
        {"nombre": "Pruebas automáticas", "tipo_espacio": "propio", "notas_de_marca": None},
    )
    ep = esp["id"]
    proy = req(
        "POST",
        f"/api/espacios/{ep}/proyectos",
        {"nombre": "Corto automático", "tipo": "corto", "formato_video": "16:9"},
    )
    corto = proy["id"]
    req(
        "PUT",
        f"/api/proyectos/{corto}/desarrollo",
        {
            "intencion": "Intención de las pruebas automáticas.",
            "premisa": "Un personaje enfrenta un dilema.",
            "estado": "listo",
            "respuestas_formato": {},
        },
    )
    for clase, nombre in (
        ("personaje", "Personaje automático"),
        ("escenario", "Escenario automático"),
        ("objeto", "Objeto automático"),
    ):
        el = elemento_aprobado(ep, clase, nombre)
        req("POST", f"/api/proyectos/{corto}/reparto", {"elemento_id": el["id"]})

    pieza = req("GET", f"/api/proyectos/{corto}/piezas")[0]
    pz = pieza["id"]
    for i in (1, 2, 3):
        req("POST", f"/api/piezas/{pz}/guion/escenas", {"titulo": f"Escena {i}"})
    return {"EP": ep, "CORTO": corto, "PZ": pz}
