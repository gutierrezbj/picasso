"""Cerrojo de las pruebas de backend: solo se ejecutan contra la base de pruebas."""
from __future__ import annotations

import os

import pytest
import requests

API_BASE = os.environ.get("API", "http://localhost:8002").rstrip("/")


def pytest_configure(config):  # noqa: ARG001
    try:
        ent = requests.get(f"{API_BASE}/api/entorno", timeout=10).json()
    except Exception as e:  # noqa: BLE001
        pytest.exit(f"No se puede consultar {API_BASE}/api/entorno: {e}", returncode=2)
    if not ent.get("es_pruebas"):
        pytest.exit(
            f"ABORTADO · la instancia de {API_BASE} usa la base «{ent.get('db_name')}», "
            "que no es la base de pruebas. Lanza las pruebas con scripts_pruebas/ejecutar.py.",
            returncode=2,
        )
