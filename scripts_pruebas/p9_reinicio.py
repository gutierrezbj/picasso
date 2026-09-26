"""Fase 6 · Qué pasa al reiniciar el estudio (§9.4). Se prueba en el proceso, no
por HTTP: `retomar()` solo corre al arrancar el backend.

Cerrojo propio: fuerza `DB_NAME` a la base de pruebas ANTES de importar la
aplicación y aborta si coincide con la base de la previsualización.
"""
import asyncio
import os
import sys
from pathlib import Path

from dotenv import dotenv_values

RAIZ = Path(__file__).resolve().parent.parent
ENV = dotenv_values(RAIZ / "backend" / ".env")
DB_PRUEBAS = ENV.get("DB_NAME_PRUEBAS") or "picasso_pruebas"
if DB_PRUEBAS == ENV.get("DB_NAME"):
    sys.exit("ABORTADO · la base de pruebas no puede ser la de la previsualización.")

os.environ["MONGO_URL"] = ENV["MONGO_URL"]
os.environ["DB_NAME"] = DB_PRUEBAS
os.environ["DB_NAME_PRUEBAS"] = DB_PRUEBAS
os.environ["DATA_DIR"] = os.environ.get("DATA_DIR") or "/tmp/picasso_pruebas"
os.environ["LATENCIA_SIMULADO_S"] = "0.3"
sys.path.insert(0, str(RAIZ / "backend"))
sys.path.insert(0, str(Path(__file__).parent))

from comun import req  # noqa: E402

from app.db import db  # noqa: E402
from app.motor import worker  # noqa: E402

PZ = os.environ["PZ"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


async def principal() -> None:
    entorno = await db.command("ping")
    ok(bool(entorno), f"conectado a la base de pruebas «{DB_PRUEBAS}»")

    lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
    escena = lienzo["escenas"][0]["escena"]
    plano = req("POST", f"/api/escenas/{escena['id']}/planos", {})
    req(
        "PATCH",
        f"/api/planos/{plano['id']}",
        {"que_se_muestra": "Prueba de reinicio.", "updated_at": plano["updated_at"]},
    )

    # Dos operaciones a medias, como las dejaría un corte del servicio.
    autorizada = req(
        "POST",
        "/api/operaciones",
        {"destino_id": plano["id"], "accion": "generar_imagen", "modelo": "sim-imagen"},
    )["operacion"]
    enviada = req(
        "POST",
        "/api/operaciones",
        {"destino_id": plano["id"], "accion": "generar_imagen", "modelo": "sim-imagen"},
    )["operacion"]

    await db.operaciones.update_one(
        {"_id": autorizada["id"]}, {"$set": {"estado": "autorizada", "autorizada_en": "antes"}}
    )
    await db.operaciones.update_one(
        {"_id": enviada["id"]}, {"$set": {"estado": "enviada", "autorizada_en": "antes"}}
    )
    await db.intentos.insert_one(
        {
            "_id": "intento-sin-id-remoto",
            "id": "intento-sin-id-remoto",
            "operacion_id": enviada["id"],
            "numero": 1,
            "proveedor": "simulado",
            "id_remoto": None,
            "estado": "enviada",
            "clave_idempotencia": enviada["clave_idempotencia"],
            "coste_real": None,
            "error": None,
            "inicio": "antes",
            "fin": None,
            "medios_resultado": [],
        }
    )

    await worker.retomar()
    for _ in range(60):
        a = await db.operaciones.find_one({"_id": autorizada["id"]})
        if a["estado"] in ("completada", "fallida"):
            break
        await asyncio.sleep(0.5)

    a = await db.operaciones.find_one({"_id": autorizada["id"]})
    e = await db.operaciones.find_one({"_id": enviada["id"]})
    ok(
        a["estado"] == "completada",
        "una operación «autorizada» que nunca se envió vuelve a la cola y se produce",
    )
    ok(a["intentos"] == 1, "y lo hace con un solo intento: no hay duplicado")
    ok(
        e["estado"] == "incierta" and "reinici" in (e["error"] or ""),
        "una «enviada» sin id_remoto pasa a incierta, sin reenviar nada",
    )
    ok(
        await db.intentos.count_documents({"operacion_id": e["id"]}) == 1,
        "la incierta no ha generado un intento nuevo",
    )

    print("\nTODO OK · Fase 6 (reinicio del estudio)")


asyncio.run(principal())
