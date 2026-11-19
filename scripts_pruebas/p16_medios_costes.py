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

from app.almacen.usos import usos_de_medio  # noqa: E402
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


def usado_en(medio_id):
    return next(m for m in req("GET", f"/api/espacios/{EP}/biblioteca")["medios"] if m["id"] == medio_id)["usado_en"]


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
    ok(usado_en(libre["id"]) == [], "la Biblioteca dice «Sin usar» de un medio libre")
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
        ok(usado_en(medio["id"]) == await usos_de_medio(medio["id"]) != [], f"la Biblioteca enseña el mismo uso que el borrado ({nombre})")
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
    ])
    h = ops.coste_de(await db.operaciones.find_one({"_id": "p16-historico"}))
    ok(h["categoria"] == "historico_tarifa" and "histórico" in h["etiqueta"], f"lo antiguo por tarifa no se presenta como cobrado: {h['etiqueta']}")
    s = ops.coste_de(await db.operaciones.find_one({"_id": "p16-simulado"}))
    ok(s["categoria"] == "informado" and s["fuente"] == "simulado", "lo antiguo del simulado es informado por el simulado")
    await db.operaciones.delete_many({"proyecto_id": PROYECTO})


async def intento(op_id, numero, estado):
    iid = f"{op_id}-i{numero}"
    await db.intentos.insert_one({
        "_id": iid, "id": iid, "operacion_id": op_id, "numero": numero, "proveedor": "fal",
        "estado": estado, "clave_idempotencia": f"{iid}-clave", "coste_estimado": 0.15,
        "inicio": "2026-11-14T10:00:00", "medios_resultado": [],
    })
    await db.operaciones.update_one({"_id": op_id}, {"$set": {"intentos": numero, "estado": estado}})
    return iid


async def reintento_autorizado(op_id):
    await ops.reintentar(op_id)
    await ops.guardar_estado(op_id, "autorizada", {"autorizada_en": "ahora"})


async def completar_con(op_id, importe):
    original = worker.proveedor
    worker.proveedor = lambda pid: FalSinImporte()
    try:
        await worker.completar(op_id, [], importe)
    finally:
        worker.proveedor = original


async def coste(op_id):
    op = await db.operaciones.find_one({"_id": op_id})
    its = await db.intentos.find({"operacion_id": op_id}).to_list(50)
    return ops.coste_de(op, its)


async def reintentos():
    # 1 · incierta → marcada fallida → reintento autorizado
    await db.operaciones.insert_one(op_doc("p16-r1", estado="incierta"))
    i1 = await intento("p16-r1", 1, "incierta")
    v = req("POST", "/api/operaciones/p16-r1/marcar-fallida")
    ok(v["operacion"]["estado"] == "fallida", "la incierta se marca fallida")
    it1 = await db.intentos.find_one({"_id": i1})
    ok(it1["posible_cargo"] is True and it1["estado"] == "fallida", "el posible cargo queda en el intento 1, no en la operación")
    ok("posible_cargo" not in (await db.operaciones.find_one({"_id": "p16-r1"})), "la operación no guarda el cargo")
    await reintento_autorizado("p16-r1")
    c = await coste("p16-r1")
    ok(c["categoria"] == "reservado" and c["contado"] == 0.15, "el reintento autorizado reserva de nuevo")
    ok(c["posible_cargo"] == 0.15 and [x["estado"] for x in c["cargos"]] == ["pendiente"], "y el posible cargo del intento 1 sigue visible")
    g = await ops.gasto(PROYECTO)
    ok(g["reservado"] == 0.15 and g["posible_cargo"] == 0.15 and g["total"] == 0.30, f"gasto: reserva nueva + cargo anterior ({g})")

    # 2 · el intento 2 se completa con importe informado
    i2 = await intento("p16-r1", 2, "en_curso")
    await completar_con("p16-r1", 0.12)
    op = await db.operaciones.find_one({"_id": "p16-r1"})
    it2 = await db.intentos.find_one({"_id": i2})
    ok(op["estado"] == "completada" and op["coste_informado"] == 0.12 and it2["coste_informado"] == 0.12 and it2["coste_informado_fuente"] == "proveedor",
       "el intento 2 completa con su importe informado")
    c = await coste("p16-r1")
    ok(c["categoria"] == "informado" and c["contado"] == 0.12 and c["posible_cargo"] == 0.15, "importe del intento 2 y cargo pendiente del 1, por separado")

    #    y otra operación cuyo intento 2 se completa sin importe
    await db.operaciones.insert_one(op_doc("p16-r2", estado="incierta"))
    await intento("p16-r2", 1, "incierta")
    req("POST", "/api/operaciones/p16-r2/marcar-fallida")
    await reintento_autorizado("p16-r2")
    await intento("p16-r2", 2, "en_curso")
    await completar_con("p16-r2", None)
    c = await coste("p16-r2")
    ok(c["categoria"] == "estimado" and c["informado"] is None and c["posible_cargo"] == 0.15, "sin importe: estimado + cargo pendiente del intento 1")

    # 3 · resolver el cargo anterior no altera el importe del segundo
    r = req("POST", f"/api/intentos/{i1}/cargo", {"cobrado": True, "importe": 0.15})
    ok(r["cargo_resuelto"] == "cobrado" and r["coste_informado"] == 0.15 and r["coste_informado_fuente"] == "manual", "el cargo del intento 1 se apunta a mano")
    op = await db.operaciones.find_one({"_id": "p16-r1"})
    it2 = await db.intentos.find_one({"_id": i2})
    ok(op["coste_informado"] == 0.12 and it2["coste_informado"] == 0.12 and it2["coste_informado_fuente"] == "proveedor",
       "el importe del intento 2 y de la operación no cambian")
    c = await coste("p16-r1")
    ok(c["contado"] == 0.12 and c["informado_cargos"] == 0.15 and c["posible_cargo"] == 0, "la operación suma 0,12 + 0,15 cobrados, sin pendientes")
    rr = requests.post(f"{API}/api/intentos/{i1}/cargo", json={"cobrado": False}, timeout=30)
    ok(rr.status_code == 409, "un cargo ya resuelto no se vuelve a resolver")
    rr = requests.post(f"{API}/api/intentos/{i2}/cargo", json={"cobrado": False}, timeout=30)
    ok(rr.status_code == 409, "un intento sin posible cargo no se resuelve")

    # 4 · varios intentos inciertos seguidos
    await db.operaciones.insert_one(op_doc("p16-r3", estado="incierta"))
    ids = []
    for n in (1, 2, 3):
        ids.append(await intento("p16-r3", n, "incierta"))
        req("POST", "/api/operaciones/p16-r3/marcar-fallida")
        if n < 3:
            await reintento_autorizado("p16-r3")
    c = await coste("p16-r3")
    ok([x["numero"] for x in c["cargos"]] == [1, 2, 3] and c["posible_cargo"] == 0.45, "tres intentos inciertos, tres posibles cargos independientes")
    req("POST", f"/api/intentos/{ids[1]}/cargo", {"cobrado": False})
    c = await coste("p16-r3")
    ok([x["estado"] for x in c["cargos"]] == ["pendiente", "sin_cargo", "pendiente"] and c["posible_cargo"] == 0.30,
       "resolver el intento 2 no toca el 1 ni el 3")

    g = await ops.gasto(PROYECTO)
    ok(g["informado"] == 0.27 and g["estimado"] == 0.15 and g["reservado"] == 0 and g["posible_cargo"] == 0.45 and g["total"] == 0.87,
       f"gasto total por capas: {g}")
    t = req("GET", f"/api/registro/totales?proyecto_id={PROYECTO}")
    ok(t["capas"]["posible_cargo"] == 0.45 and abs(t["total"] - 0.87) < 0.005, "los totales del Registro cuadran")
    lista = req("GET", f"/api/operaciones?proyecto_id={PROYECTO}")
    ok(all("cargos" in o["coste"] for o in lista), "el Registro trae los cargos de cada intento")
    csv = requests.get(f"{API}/api/registro/exportar.csv?proyecto_id={PROYECTO}", timeout=30).text
    ok("posible_cargo_pendiente" in csv.splitlines()[0] and "informado_cargos" in csv.splitlines()[0], "el CSV separa los cargos por intento")
    await db.operaciones.delete_many({"proyecto_id": PROYECTO})
    await db.intentos.delete_many({"operacion_id": {"$in": ["p16-r1", "p16-r2", "p16-r3"]}})


async def presupuesto_fino():
    await db.proyectos.update_one({"_id": PROYECTO}, {"$set": {"id": PROYECTO, "presupuesto_max": 0.20}}, upsert=True)
    try:
        await db.operaciones.insert_many([
            op_doc("p16-mejora", accion="mejorar_texto", proveedor="openai", coste_estimado=0.0238),
            op_doc("p16-nueva", estado="presupuestada", coste_estimado=0.198),
        ])
        await db.intentos.insert_one({
            "_id": "p16-mejora-i1", "id": "p16-mejora-i1", "operacion_id": "p16-mejora", "numero": 1, "proveedor": "openai",
            "estado": "completada", "estado_consumo": "valido", "coste_segun_tarifa": 0.0032, "coste_estimado": 0.0238,
        })
        p = await ops.presupuesto(PROYECTO, 0.198)
        ok(p["gasto"]["estimado"] == 0.0032 and p["gasto"]["total"] == 0.0032, f"el gasto conserva 0,0032 $: {p['gasto']['total']}")
        ok(p["presupuesto_restante"] == 0.1968, f"restante 0,20 − 0,0032 = 0,1968 $: {p['presupuesto_restante']}")
        ok(p["supera_presupuesto"], "una reserva de 0,198 $ supera el restante")
        try:
            await ops.autorizar("p16-nueva", False)
            exigida = False
        except PermissionError as e:
            exigida = "0.1968" in str(e)
        doc = await db.operaciones.find_one({"_id": "p16-nueva"})
        ok(exigida and doc["estado"] == "presupuestada", "sin confirmar no se autoriza: pide confirmación y sigue presupuestada")
        ok(not (await ops.presupuesto(PROYECTO, 0.1968))["supera_presupuesto"], "una reserva de 0,1968 $ cabe justo, sin confirmación")
    finally:
        await db.operaciones.delete_many({"proyecto_id": PROYECTO})
        await db.intentos.delete_many({"operacion_id": "p16-mejora"})
        await db.proyectos.delete_many({"_id": PROYECTO})


async def main():
    await proteccion()
    await costes()
    await reintentos()
    await presupuesto_fino()


asyncio.run(main())
