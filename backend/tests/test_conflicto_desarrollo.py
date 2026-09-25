"""§12: conflicto de versión en el Desarrollo (409) y §15.5: cerrojo del entorno."""
from __future__ import annotations

import os

import pytest
import requests

BASE = os.environ.get("API", "http://localhost:8002").rstrip("/")
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def proyecto(s):
    esp = s.post(
        f"{API}/espacios", json={"nombre": "Conflictos", "tipo_espacio": "propio"}
    ).json()
    proy = s.post(
        f"{API}/espacios/{esp['id']}/proyectos",
        json={"nombre": "Corto de conflictos", "tipo": "corto", "formato_video": "16:9"},
    ).json()
    yield proy["id"]
    s.delete(f"{API}/espacios/{esp['id']}")


def test_entorno_es_la_base_de_pruebas(s):
    ent = s.get(f"{API}/entorno").json()
    assert ent["es_pruebas"] is True
    assert ent["db_name"] == "picasso_pruebas"


def test_desarrollo_sella_y_rechaza_conflicto(s, proyecto):
    vacio = s.get(f"{API}/proyectos/{proyecto}/desarrollo").json()
    assert vacio["updated_at"] is None

    primero = s.put(
        f"{API}/proyectos/{proyecto}/desarrollo",
        json={**vacio, "intencion": "Primera versión"},
    )
    assert primero.status_code == 200
    sello = primero.json()["updated_at"]
    assert sello

    # Segunda pestaña: guarda con el sello bueno.
    segundo = s.put(
        f"{API}/proyectos/{proyecto}/desarrollo",
        json={**primero.json(), "intencion": "Segunda versión"},
    )
    assert segundo.status_code == 200
    assert segundo.json()["updated_at"] != sello

    # La primera pestaña, con el sello viejo, es rechazada con 409.
    tarde = s.put(
        f"{API}/proyectos/{proyecto}/desarrollo",
        json={**primero.json(), "intencion": "Versión atrasada"},
    )
    assert tarde.status_code == 409

    # Nada se ha perdido: sigue vigente la segunda versión.
    ahora = s.get(f"{API}/proyectos/{proyecto}/desarrollo").json()
    assert ahora["intencion"] == "Segunda versión"

    # Sobrescribir: se relee el sello y se vuelve a guardar.
    forzado = s.put(
        f"{API}/proyectos/{proyecto}/desarrollo",
        json={**ahora, "intencion": "Versión atrasada"},
    )
    assert forzado.status_code == 200
    assert s.get(f"{API}/proyectos/{proyecto}/desarrollo").json()["intencion"] == (
        "Versión atrasada"
    )
