"""Backend tests for studio Fase 1 API."""
from __future__ import annotations

import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://recorridos.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# --- Salud & recorridos ------------------------------------------------------

def test_salud(s):
    r = s.get(f"{API}/salud")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}


def test_recorridos_lista(s):
    r = s.get(f"{API}/recorridos")
    assert r.status_code == 200
    data = r.json()
    tipos = {x["tipo"] for x in data}
    assert tipos == {"corto", "anuncio", "imagen", "serie"}


# --- Estudio vacio -----------------------------------------------------------

def test_estudio_inicial_vacio(s):
    r = s.get(f"{API}/estudio")
    assert r.status_code == 200
    data = r.json()
    assert data["espacios"] == []
    assert data["retomar"] is None
    assert data["recientes"] == []


# --- Ajustes ------------------------------------------------------------------

def test_ajustes_get_defaults(s):
    r = s.get(f"{API}/ajustes")
    assert r.status_code == 200
    d = r.json()
    assert "moneda" in d and "presupuesto_por_defecto" in d


def test_ajustes_put_eur_and_persist(s):
    r = s.put(f"{API}/ajustes", json={"moneda": "EUR", "presupuesto_por_defecto": 1000})
    assert r.status_code == 200
    assert r.json()["moneda"] == "EUR"
    r2 = s.get(f"{API}/ajustes")
    assert r2.json()["moneda"] == "EUR"
    assert r2.json()["presupuesto_por_defecto"] == 1000
    # reset
    s.put(f"{API}/ajustes", json={"moneda": "USD", "presupuesto_por_defecto": 0})


# --- Espacio CRUD -------------------------------------------------------------

@pytest.fixture(scope="module")
def espacio_id(s):
    r = s.post(f"{API}/espacios", json={"nombre": "TEST_Cliente_A", "tipo_espacio": "cliente", "descripcion": "n"})
    assert r.status_code == 201, r.text
    d = r.json()
    assert d["nombre"] == "TEST_Cliente_A"
    assert d["tipo_espacio"] == "cliente"
    assert d["num_proyectos"] == 0
    assert d["num_en_curso"] == 0
    return d["id"]


def test_espacio_created_persists(s, espacio_id):
    r = s.get(f"{API}/espacios/{espacio_id}")
    assert r.status_code == 200
    assert r.json()["nombre"] == "TEST_Cliente_A"


def test_listar_espacios(s, espacio_id):
    r = s.get(f"{API}/espacios")
    assert r.status_code == 200
    ids = [e["id"] for e in r.json()]
    assert espacio_id in ids


# --- Proyecto por cada tipo, con validacion de recorrido ----------------------

TIPOS_ESPERADOS = {
    "corto":  ["Idea", "Mundo y escenarios", "Personajes", "Objetos", "Guion", "Lienzo", "Montaje"],
    "anuncio": ["Idea y mensaje", "Producto", "Personajes", "Escenario", "Guion", "Lienzo", "Montaje"],
    "imagen": ["Idea", "Elementos", "Encargo de imagen", "Lienzo"],
    "serie":  ["Premisa", "Mundo y escenarios", "Personajes", "Objetos", "Capítulos", "Lienzo", "Montaje"],
}


@pytest.fixture(scope="module")
def proyectos(s, espacio_id):
    creados = {}
    for tipo in TIPOS_ESPERADOS:
        r = s.post(f"{API}/espacios/{espacio_id}/proyectos", json={
            "nombre": f"TEST_{tipo}", "tipo": tipo, "formato_video": "16:9"
        })
        assert r.status_code == 201, (tipo, r.text)
        creados[tipo] = r.json()
    return creados


@pytest.mark.parametrize("tipo,esperado", list(TIPOS_ESPERADOS.items()))
def test_recorrido_pasos_por_tipo(s, proyectos, tipo, esperado):
    p = proyectos[tipo]
    r = s.get(f"{API}/proyectos/{p['id']}")
    assert r.status_code == 200
    body = r.json()
    nombres = [x["nombre"] for x in body["recorrido"]["pasos"]]
    assert nombres == esperado, f"{tipo}: {nombres} != {esperado}"
    # first step en_curso, rest bloqueado/pendiente
    estados = [x["estado"] for x in body["recorrido"]["pasos"]]
    assert estados[0] == "en_curso"
    # obligatorios posteriores => bloqueado
    # ensure no montaje for imagen
    if tipo == "imagen":
        assert "Montaje" not in nombres
        assert nombres[2] == "Encargo de imagen"
    # gasto siempre presente e igual 0
    assert body["gasto"] == 0.0
    assert body["moneda"] in ("USD", "EUR")


def test_ultima_ubicacion_guardar_y_leer(s, proyectos):
    p = proyectos["corto"]
    ruta = f"/p/{p['id']}/paso/guion"
    r = s.post(f"{API}/proyectos/{p['id']}/ubicacion", json={"ultima_ubicacion": ruta})
    assert r.status_code == 200
    # Retomar en /api/estudio
    r2 = s.get(f"{API}/estudio")
    ret = r2.json()["retomar"]
    assert ret is not None
    assert ret["ultima_ubicacion"] == ruta


def test_no_auto_content(s, proyectos):
    """Un proyecto recien creado no crea ideas/personajes/guiones."""
    p = proyectos["corto"]
    r = s.get(f"{API}/proyectos/{p['id']}")
    d = r.json()["proyecto"]
    # No hay 'ideas' / 'personajes' / etc en el doc
    for k in ("ideas", "personajes", "guion_texto", "escenarios"):
        assert k not in d or not d[k]


# --- Cleanup ------------------------------------------------------------------

def test_cleanup(s, espacio_id):
    r = s.delete(f"{API}/espacios/{espacio_id}")
    assert r.status_code == 204
    r2 = s.get(f"{API}/espacios/{espacio_id}")
    assert r2.status_code == 404
