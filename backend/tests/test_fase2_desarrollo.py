"""Backend tests for Fase 2: Desarrollo + Asistente."""
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
def espacio(s):
    r = s.post(f"{API}/espacios", json={"nombre": "TEST_F2_Espacio", "tipo_espacio": "cliente"})
    assert r.status_code == 201, r.text
    eid = r.json()["id"]
    yield eid
    s.delete(f"{API}/espacios/{eid}")


@pytest.fixture(scope="module")
def proyectos(s, espacio):
    creados = {}
    for tipo in ("corto", "anuncio", "imagen", "serie"):
        r = s.post(f"{API}/espacios/{espacio}/proyectos", json={
            "nombre": f"TEST_F2_{tipo}", "tipo": tipo, "formato_video": "16:9",
        })
        assert r.status_code == 201, r.text
        creados[tipo] = r.json()["id"]
    return creados


# --- Formatos ---------------------------------------------------------------

@pytest.mark.parametrize("tipo,esperado_clave", [
    ("corto", "objetivo"),
    ("anuncio", "accion"),
    ("imagen", "uso"),
    ("serie", "episodios"),
])
def test_formatos_por_tipo(s, tipo, esperado_clave):
    r = s.get(f"{API}/formatos", params={"tipo": tipo})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    claves = {p["clave"] for p in data[0]["preguntas_desarrollo"]}
    assert esperado_clave in claves


# --- Desarrollo GET/PUT ------------------------------------------------------

def test_get_desarrollo_default(s, proyectos):
    pid = proyectos["corto"]
    r = s.get(f"{API}/proyectos/{pid}/desarrollo")
    assert r.status_code == 200
    d = r.json()
    assert d["estado"] == "en_curso"
    assert d.get("intencion") in (None, "")
    assert d.get("respuestas_formato") == {}


def test_put_desarrollo_persist(s, proyectos):
    pid = proyectos["anuncio"]
    payload = {
        "intencion": "Vender X",
        "mensaje": "Comprar ya",
        "publico": "18-25",
        "tono": "energético",
        "notas": "una nota",
        "respuestas_formato": {"accion": "haz clic"},
        "estado": "en_curso",
    }
    r = s.put(f"{API}/proyectos/{pid}/desarrollo", json=payload)
    assert r.status_code == 200
    d = r.json()
    assert d["intencion"] == "Vender X"
    # verify persistence
    r2 = s.get(f"{API}/proyectos/{pid}/desarrollo")
    assert r2.json()["intencion"] == "Vender X"
    assert r2.json()["respuestas_formato"]["accion"] == "haz clic"


def test_put_desarrollo_404(s):
    r = s.put(f"{API}/proyectos/no-existe/desarrollo", json={})
    assert r.status_code == 404


def test_desarrollo_listo_marca_paso(s, proyectos):
    pid = proyectos["corto"]
    payload = {"intencion": "algo", "premisa": "una premisa", "estado": "listo"}
    r = s.put(f"{API}/proyectos/{pid}/desarrollo", json=payload)
    assert r.status_code == 200
    # get proyecto, verify idea step listo and next en_curso
    r2 = s.get(f"{API}/proyectos/{pid}")
    assert r2.status_code == 200
    pasos = r2.json()["recorrido"]["pasos"]
    idea = next(p for p in pasos if p["pantalla"] == "idea")
    assert idea["estado"] == "listo"
    idx = pasos.index(idea)
    if idx + 1 < len(pasos):
        assert pasos[idx + 1]["estado"] in ("en_curso", "pendiente")
        # next obligatorio -> en_curso
        assert pasos[idx + 1]["estado"] == "en_curso"


# --- Asistente estado --------------------------------------------------------

def test_asistente_estado_simulado(s):
    s.put(f"{API}/ajustes", json={"modelo_asistente": "simulado"})
    r = s.get(f"{API}/asistente/estado")
    assert r.status_code == 200
    d = r.json()
    assert d["modelo"] == "simulado"
    assert d["disponible"] is True


def test_asistente_estado_claude(s):
    s.put(f"{API}/ajustes", json={"modelo_asistente": "claude-sonnet-5"})
    r = s.get(f"{API}/asistente/estado")
    assert r.status_code == 200
    d = r.json()
    assert d["modelo"] == "claude-sonnet-5"
    assert d["disponible"] is True  # EMERGENT_LLM_KEY present
    # reset for other tests
    s.put(f"{API}/ajustes", json={"modelo_asistente": "simulado"})


# --- Asistente proponer (simulado) ------------------------------------------

def test_asistente_tarea_invalida(s, proyectos):
    s.put(f"{API}/ajustes", json={"modelo_asistente": "simulado"})
    pid = proyectos["corto"]
    r = s.post(f"{API}/proyectos/{pid}/asistente/xxx", json={})
    assert r.status_code == 400


def test_asistente_hacer_preguntas_simulado(s, proyectos):
    s.put(f"{API}/ajustes", json={"modelo_asistente": "simulado"})
    pid = proyectos["corto"]
    r = s.post(f"{API}/proyectos/{pid}/asistente/hacer_preguntas", json={})
    assert r.status_code == 200
    prop = r.json()
    assert prop["proveedor"] == "simulado"
    assert prop["tarea"] == "hacer_preguntas"
    assert len(prop["partes"]) >= 1
    for p in prop["partes"]:
        # El destino lo elige el usuario en «Responder en» (Fase 3), así que la
        # propuesta llega sin destino fijado.
        assert p["destino_campo"] is None
        assert p["estado"] == "pendiente"


def test_asistente_proponer_campo_simulado(s, proyectos):
    pid = proyectos["corto"]
    r = s.post(f"{API}/proyectos/{pid}/asistente/proponer_campo", json={"campo": "intencion"})
    assert r.status_code == 200
    prop = r.json()
    assert len(prop["partes"]) == 1
    assert prop["partes"][0]["destino_campo"] == "intencion"


def test_aceptar_parte_escribe_en_desarrollo(s, proyectos):
    pid = proyectos["imagen"]
    # limpiar el desarrollo
    s.put(f"{API}/proyectos/{pid}/desarrollo", json={"estado": "en_curso"})
    r = s.post(f"{API}/proyectos/{pid}/asistente/proponer_campo", json={"campo": "intencion"})
    prop = r.json()
    parte = prop["partes"][0]
    # antes de aceptar, el desarrollo no tiene intencion
    r0 = s.get(f"{API}/proyectos/{pid}/desarrollo")
    assert (r0.json().get("intencion") or "") == ""
    # aceptar con texto editado
    r2 = s.post(f"{API}/propuestas/{prop['id']}/parte/{parte['id']}", json={"accion": "aceptar", "texto": "texto editado"})
    assert r2.status_code == 200
    assert r2.json()["desarrollo"]["intencion"] == "texto editado"
    # persistencia
    r3 = s.get(f"{API}/proyectos/{pid}/desarrollo")
    assert r3.json()["intencion"] == "texto editado"


def test_descartar_parte_no_escribe(s, proyectos):
    pid = proyectos["serie"]
    s.put(f"{API}/proyectos/{pid}/desarrollo", json={"estado": "en_curso"})
    r = s.post(f"{API}/proyectos/{pid}/asistente/proponer_campo", json={"campo": "premisa"})
    prop = r.json()
    parte = prop["partes"][0]
    r2 = s.post(f"{API}/propuestas/{prop['id']}/parte/{parte['id']}", json={"accion": "descartar"})
    assert r2.status_code == 200
    r3 = s.get(f"{API}/proyectos/{pid}/desarrollo")
    assert (r3.json().get("premisa") or "") == ""


# --- Asistente Claude live (§15.5: marca `integracion`, se ejecuta a mano) ----

@pytest.mark.skipif(
    os.environ.get("PRUEBAS_INTEGRACION") != "1",
    reason="Llama a Claude de verdad. Ejecuta con PRUEBAS_INTEGRACION=1.",
)
@pytest.mark.integracion
def test_asistente_claude_live_una_vez(s, proyectos):
    s.put(f"{API}/ajustes", json={"modelo_asistente": "claude-sonnet-5"})
    pid = proyectos["anuncio"]
    r = s.post(f"{API}/proyectos/{pid}/asistente/hacer_preguntas", json={}, timeout=90)
    # reset
    s.put(f"{API}/ajustes", json={"modelo_asistente": "simulado"})
    assert r.status_code == 200, r.text
    prop = r.json()
    assert prop["proveedor"] == "anthropic"
    assert len(prop["partes"]) >= 1
    for p in prop["partes"]:
        assert p["texto"].strip()
