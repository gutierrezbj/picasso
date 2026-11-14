"""PIC-02: protección de medios (R1) y costes en tres capas. En el proceso, como
p9, con la API de pruebas para los borrados.

Cerrojo propio: fuerza `DB_NAME` a la base de pruebas ANTES de importar la
aplicación y aborta si coincide con la base de la previsualización.
"""
import asyncio
import os
import sys
from pathlib import Path

import requests
from dotenv import dotenv_values

RAIZ = Path(__file__).resolve().parent.parent
ENV = {**dotenv_values(RAIZ / "backend" / ".env"), **{k: v for k, v in os.environ.items() if k in ("MONGO_URL", "DB_NAME", "DB_NAME_PRUEBAS")}}
DB_PRUEBAS = ENV.get("DB_NAME_PRUEBAS") or "picasso_pruebas"
if DB_PRUEBAS == ENV.get("DB_NAME"):
    sys.exit("ABORTADO · la base de pruebas no puede ser la de la previsualización.")

os.environ["MONGO_URL"] = ENV["MONGO_URL"]
os.environ["DB_NAME"] = DB_PRUEBAS
os.environ["DB_NAME_PRUEBAS"] = DB_PRUEBAS
os.environ["DATA_DIR"] = os.environ.get("DATA_DIR") or "/tmp/picasso_pruebas"
sys.path.insert(0, str(RAIZ / "backend"))
sys.path.insert(0, str(Path(__file__).parent))

from comun import API, req, subir_imagen  # noqa: E402

from app.db import db  # noqa: E402
from app.motor import operaciones as ops  # noqa: E402
from app.motor import worker  # noqa: E402

EP = os.environ["EP"]
PROYECTO = "p16-proyecto"


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def borrar(medio_id):
    return requests.delete(f"{API}/api/medios/{medio_id}", timeout=30)


def op_doc(oid, **extra):
    base = {
        "_id": oid, "id": oid, "proyecto_id": PROYECTO, "espacio_id": EP,
        "destino": {"tipo": "taller", "id": "p16-carpeta"}, "accion": "generar_imagen",
        "modelo": "fal-nano-banana-pro", "proveedor": "fal", "entradas": {"accion": "generar_imagen", "modelo": "fal-nano-banana-pro", "prompt": "x", "n_variantes": 1},
        "coste_estimado": 0.15, "estado": "completada", "created_at": "2026-11-14T10:00:00", "updated_at": "2026-11-14T10:00:00",
    }
    base.update(extra)
    return base


async def proteccion():
    libre = subir_imagen(EP, "libre.png")
    ok(borrar(libre["id"]).status_code == 200, "un medio que no se usa se borra")

    casos = {
        "toma": lambda m: db.tomas.insert_one({"_id": "p16-toma", "id": "p16-toma", "medio_id": m, "carpeta_id": "p16-carpeta", "numero": 1}),
    }
    for campo in ("imagen_entrada", "primer_fotograma", "ultimo_fotograma", "video_entrada", "audio_entrada", "retrato"):
        casos[campo] = (lambda c: lambda m: db.operaciones.insert_one(op_doc(f"p16-{c}", entradas={"accion": "editar_imagen", c: {"medio_id": m, "ruta": "x"}})))(campo)
    casos["referencias"] = lambda m: db.operaciones.insert_one(op_doc("p16-refs", entradas={"accion": "imagen_con_referencias", "referencias": [{"medio_id": "otro", "ruta": "x"}, {"medio_id": m, "ruta": "x"}]}))
    casos["taller.referencias"] = lambda m: db.operaciones.insert_one(op_doc("p16-taller-refs", taller={"texto": "x", "referencias": [m]}))

    for nombre, crear in casos.items():
        medio = subir_imagen(EP, f"{nombre}.png")
        await crear(medio["id"])
        r = borrar(medio["id"])
        ok(r.status_code == 409 and "No se puede borrar" in r.json().get("detail", ""), f"409 si es {nombre}: {r.json().get('detail')}")
        ok((await db.medios.find_one({"_id": medio["id"]})) is not None, f"el medio sigue ahí ({nombre})")
    await db.tomas.delete_many({"_id": "p16-toma"})
    await db.operaciones.delete_many({"proyecto_id": PROYECTO})


class FalSinImporte:
    id = "fal"

    async def descargar(self, url):
        return b""


async def costes():
    original = worker.proveedor
    worker.proveedor = lambda pid: FalSinImporte()
    try:
        await db.operaciones.insert_one(op_doc("p16-real", estado="en_curso"))
        await worker.completar("p16-real", [], None)
    finally:
        worker.proveedor = original
    real = await db.operaciones.find_one({"_id": "p16-real"})
    ok(real["estado"] == "completada", "la operación de un proveedor real se completa")
    ok(real.get("coste_informado") is None and real.get("coste_real") is None, "sin importe del proveedor no se rellena nada con la tarifa")
    c = ops.coste_de(real)
    ok(c["categoria"] == "estimado" and c["contado"] == 0.15, f"cuenta como estimado: {c['etiqueta']}")

    await db.operaciones.insert_many([
        op_doc("p16-historico", coste_real=0.15),
        op_doc("p16-simulado", proveedor="simulado", coste_real=0.04, coste_estimado=0.04),
        op_doc("p16-reserva", estado="autorizada"),
        op_doc("p16-incierta", estado="incierta"),
        op_doc("p16-incierta-2", estado="incierta"),
    ])
    h = ops.coste_de(await db.operaciones.find_one({"_id": "p16-historico"}))
    ok(h["categoria"] == "historico_tarifa" and "histórico" in h["etiqueta"], f"lo antiguo por tarifa no se presenta como cobrado: {h['etiqueta']}")
    s = ops.coste_de(await db.operaciones.find_one({"_id": "p16-simulado"}))
    ok(s["categoria"] == "informado" and s["fuente"] == "simulado", "lo antiguo del simulado es informado por el simulado")

    v = req("POST", "/api/operaciones/p16-incierta/marcar-fallida")
    ok(v["operacion"]["estado"] == "fallida" and v["operacion"]["posible_cargo"] is True, "«incierta» marcada fallida queda como posible cargo")
    req("POST", "/api/operaciones/p16-incierta-2/marcar-fallida")

    g = (await ops.gasto(PROYECTO))
    ok(g["estimado"] == 0.30, f"estimado = sin importe (0,15) + histórico por tarifa (0,15): {g['estimado']}")
    ok(g["informado"] == 0.04, f"informado: {g['informado']}")
    ok(g["reservado"] == 0.15, f"reservado: {g['reservado']}")
    ok(g["posible_cargo"] == 0.30, f"posible cargo: {g['posible_cargo']}")
    ok(g["total"] == 0.79 and "real" not in g, f"total {g['total']} y sin la clave engañosa «real»")

    r = requests.post(f"{API}/api/operaciones/p16-reserva/cargo", json={"cobrado": False}, timeout=30)
    ok(r.status_code == 409, "solo se resuelve un posible cargo que exista")
    v = req("POST", "/api/operaciones/p16-incierta/cargo", {"cobrado": False})
    ok(v["operacion"]["posible_cargo"] is False, "«No hubo cargo» quita el posible cargo")
    v = req("POST", "/api/operaciones/p16-incierta-2/cargo", {"cobrado": True, "importe": 0.15})
    ok(v["operacion"]["coste_informado"] == 0.15 and v["operacion"]["coste_informado_fuente"] == "manual", "«Hubo cargo» lo apunta como informado a mano")
    g = await ops.gasto(PROYECTO)
    ok(g["posible_cargo"] == 0 and g["informado"] == 0.19, f"el gasto se recoloca: {g}")

    lista = req("GET", f"/api/operaciones?proyecto_id={PROYECTO}")
    ok(all("coste" in o and "categoria" in o["coste"] for o in lista), "el Registro trae el coste desglosado de cada operación")
    csv = requests.get(f"{API}/api/registro/exportar.csv?proyecto_id={PROYECTO}", timeout=30).text
    ok("coste_informado_fuente" in csv.splitlines()[0] and "historico_tarifa" in csv, "el CSV separa estimado, informado y su fuente")
    await db.operaciones.delete_many({"proyecto_id": PROYECTO})


async def main():
    await proteccion()
    await costes()


asyncio.run(main())
