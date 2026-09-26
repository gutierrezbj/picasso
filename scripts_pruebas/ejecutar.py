"""Lanzador de las pruebas del constructor (§15.5).

Levanta una SEGUNDA instancia del backend dentro del contenedor, con su propia
base de datos (`DB_NAME_PRUEBAS`) y su propio almacén de ficheros, ejecuta pytest
y los scripts p1…p6 contra ella, la para y borra la base. La instancia de la
previsualización (puerto 8001, base del usuario) no se toca en ningún momento.

Uso:  python3 scripts_pruebas/ejecutar.py [p1 p2 …]
"""
from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

import requests
from dotenv import dotenv_values
from pymongo import MongoClient

RAIZ = Path(__file__).resolve().parent.parent
BACKEND = RAIZ / "backend"
ENV = {**dotenv_values(BACKEND / ".env"), **{k: v for k, v in os.environ.items() if k in ("MONGO_URL", "DB_NAME", "DB_NAME_PRUEBAS")}}
MONGO_URL = ENV["MONGO_URL"]
DB_REAL = ENV["DB_NAME"]
DB_PRUEBAS = ENV.get("DB_NAME_PRUEBAS") or "picasso_pruebas"
PUERTO = int(os.environ.get("PUERTO_PRUEBAS", "8002"))
DATA_DIR = Path("/tmp/picasso_pruebas")
API = f"http://localhost:{PUERTO}"

SCRIPTS = [
    "p1_guion",
    "p2_revision",
    "p3_encargo_serie",
    "p4_asistente",
    "p5_diff",
    "p6_hablantes",
    "p7_lienzo",
    "p8_motor",
    "p9_reinicio",
    "p10_voces",
]


def limpiar_base() -> None:
    if DB_PRUEBAS == DB_REAL:
        sys.exit("ABORTADO · DB_NAME_PRUEBAS no puede ser la base de la previsualización.")
    MongoClient(MONGO_URL).drop_database(DB_PRUEBAS)
    shutil.rmtree(DATA_DIR, ignore_errors=True)


def levantar() -> subprocess.Popen:
    entorno = {
        **os.environ,
        **{k: v for k, v in ENV.items() if v is not None},
        "DB_NAME": DB_PRUEBAS,
        "DB_NAME_PRUEBAS": DB_PRUEBAS,
        "DATA_DIR": str(DATA_DIR),
    }
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", str(PUERTO)],
        cwd=BACKEND,
        env=entorno,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    for _ in range(60):
        try:
            if requests.get(f"{API}/api/salud", timeout=2).json().get("estado") == "ok":
                break
        except Exception:  # noqa: BLE001
            time.sleep(0.5)
    else:
        proc.kill()
        sys.exit("ABORTADO · la instancia de pruebas no ha arrancado.")
    ent = requests.get(f"{API}/api/entorno", timeout=5).json()
    if not ent.get("es_pruebas") or ent.get("db_name") != DB_PRUEBAS:
        proc.kill()
        sys.exit(f"ABORTADO · la instancia de pruebas apunta a «{ent.get('db_name')}».")
    print(f"Instancia de pruebas en {API} · base «{ent['db_name']}» · almacén {DATA_DIR}")
    return proc


def ejecutar(nombre: str, cmd: list[str], entorno: dict) -> bool:
    print(f"\n=== {nombre} " + "=" * (60 - len(nombre)))
    r = subprocess.run(cmd, cwd=RAIZ, env=entorno, check=False)
    ok = r.returncode == 0
    print(f"--- {nombre}: {'OK' if ok else 'FALLA'}")
    return ok


def main() -> None:
    pedidos = sys.argv[1:]
    limpiar_base()
    proc = levantar()
    entorno = {**os.environ, "API": API}
    resultados: dict[str, bool] = {}
    try:
        resultados["pytest"] = ejecutar(
            "pytest", [sys.executable, "-m", "pytest", "backend/tests", "-q"], entorno
        )
        import sys as _sys

        _sys.path.insert(0, str(RAIZ / "scripts_pruebas"))
        os.environ["API"] = API
        from comun import semilla

        ids = semilla()
        print(f"\nSemilla creada en la base de pruebas: {ids}")
        entorno.update(ids)
        for nombre in SCRIPTS:
            if pedidos and not any(p in nombre for p in pedidos):
                continue
            resultados[nombre] = ejecutar(
                nombre, [sys.executable, f"scripts_pruebas/{nombre}.py"], entorno
            )
    finally:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc.wait(timeout=20)
        limpiar_base()
        print("\nInstancia de pruebas parada y base de pruebas borrada.")

    print("\nRESUMEN")
    for nombre, ok in resultados.items():
        print(f"  {'OK   ' if ok else 'FALLA'} {nombre}")
    sys.exit(0 if all(resultados.values()) else 1)


if __name__ == "__main__":
    main()
