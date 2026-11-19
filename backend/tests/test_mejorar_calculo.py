import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from app.mejorar import calculo as c

T = c.TARIFA
CFG = c.CONFIGURACION


def _u(entrada, salida, total=None, razonamiento=0, **det_e):
    return {
        "input_tokens": entrada,
        "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0, **det_e},
        "output_tokens": salida,
        "output_tokens_details": {"reasoning_tokens": razonamiento},
        "total_tokens": entrada + salida if total is None else total,
    }


def test_ejemplo_oficial_razonamiento_dentro_de_la_salida():
    r = c.evaluar_consumo(_u(75, 1186, 1261, 1024), T, CFG)
    assert r["estado_consumo"] == "valido"
    assert r["coste_segun_tarifa"] == round((75 * 2.0 + 1186 * 10.0) / 1e6, 4)


def test_cache_separada_lectura_escritura_y_normal():
    u = _u(12000, 1000, cached_tokens=4000, cache_write_tokens=7000, cache_write_tokens_details={"ttl_30m_tokens": 5000, "ttl_12h_tokens": 2000})
    r = c.evaluar_consumo(u, T, CFG)
    esperado = (1000 * 2.0 + 4000 * 0.10 + 5000 * 2.5 + 2000 * 5.0 + 1000 * 10.0) / 1e6
    assert r["tokens"]["entrada_normal"] == 1000
    assert r["coste_segun_tarifa"] == round(esperado, 4)
    assert "escritura en caché no esperada" in r["marcas"]


def test_ausente_cero_y_sin_cuadrar():
    assert c.evaluar_consumo(None, T, CFG)["estado_consumo"] == "ausente"
    assert c.evaluar_consumo({"input_tokens": None, "output_tokens": None, "total_tokens": None}, T, CFG)["estado_consumo"] == "ausente"
    cero = c.evaluar_consumo(_u(0, 0), T, CFG)
    assert cero["estado_consumo"] == "valido" and cero["coste_segun_tarifa"] == 0
    assert c.evaluar_consumo(_u(10, 5, total=99), T, CFG)["estado_consumo"] == "sin_cuadrar"
    assert c.evaluar_consumo(_u(10, -1), T, CFG)["estado_consumo"] == "sin_cuadrar"
    assert c.evaluar_consumo(_u(10, 5, razonamiento=6), T, CFG)["estado_consumo"] == "sin_cuadrar"


def test_reserva_usa_la_escritura_de_la_ttl_elegida():
    r30 = c.reserva_estimada(1000, T, CFG)
    r12 = c.reserva_estimada(1000, T, {**CFG, "prompt_cache_options": {"mode": "explicit", "ttl": "12h"}})
    assert r30 == pytest.approx((1256 * 2.5 + 2000 * 10) / 1e6, abs=1e-4)
    assert r12 == pytest.approx((1256 * 5.0 + 2000 * 10) / 1e6, abs=1e-4)


def test_limites_de_entrada():
    with pytest.raises(c.EntradaInvalida):
        c.construir_entrada("x" * 2001, "9:16", [], 4)
    with pytest.raises(c.EntradaInvalida):
        c.construir_entrada("hola", "9:16", [{"nombre": "a"}] * 5, 4)
    e = c.construir_entrada("hola", "9:16", [{"nombre": "n" * 90, "rasgos_fijos": ["r" * 500]}], 4)
    assert e["referencias"][0]["nombre"].endswith("…") and len(e["referencias"][0]["nombre"]) == 80
    assert len(e["referencias"][0]["rasgos"]) == 400 and e["referencias"][0]["recortado"]


def test_aviso_por_motivo():
    for motivo, trozo in (("max_output_tokens", "límite de salida (2000"), ("content_filter", "filtro de contenido"), ("max_messages", "límite de mensajes"), ("steered", "(steered)"), ("raro", "«raro»")):
        p = c.evaluar_propuesta("incomplete", '{"texto": "a"', motivo, 2000)
        assert trozo in p["aviso"] and p["calidad"] == "incompleta"


def test_propuesta_no_depende_del_consumo():
    p = c.evaluar_propuesta("completed", '{"texto": "nuevo", "cambios": [{"parte": "luz", "motivo": "x"}]}', None, 2000)
    assert p["calidad"] == "completa" and p["texto"] == "nuevo"
    assert c.evaluar_propuesta("completed", "sin json", None, 2000)["calidad"] == "ilegible"


def test_aviso_de_tarifa_a_los_30_dias():
    assert c.aviso_tarifa(T, date(2026, 12, 18)) is None
    assert c.aviso_tarifa(T, date(2026, 12, 19)) == "Tarifa sin verificar desde 18-11-2026"
