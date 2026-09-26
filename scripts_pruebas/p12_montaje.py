"""Prueba de la Fase 7 · línea de tiempo del montaje (§11.2).
Solo contra la base de pruebas (cerrojo en comun.py)."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from comun import req  # noqa: E402

PZ = os.environ["PZ"]
CORTO = os.environ["CORTO"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


g = req("GET", f"/api/piezas/{PZ}/guion")
if g["guion"]["estado"] != "aprobado":
    for e in g["escenas"]:
        req("PATCH", f"/api/escenas/{e['id']}", {
            "titulo": e["titulo"] or "Escena", "que_ocurre": e["que_ocurre"] or "Pasa algo.",
            "updated_at": e["updated_at"],
        })
    req("POST", f"/api/piezas/{PZ}/guion/aprobar")

lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
bloque = lienzo["escenas"][0]
while len(bloque["planos"]) < 2:
    req("POST", f"/api/escenas/{bloque['escena']['id']}/planos", {})
    bloque = req("GET", f"/api/piezas/{PZ}/lienzo")["escenas"][0]
planos = sorted(bloque["planos"], key=lambda p: p["orden"])
p1, p2 = planos[0], planos[1]
req("PATCH", f"/api/planos/{p2['id']}", {"duracion_s": 2.5, "modalidad": "video", "updated_at": p2["updated_at"]})

# Una toma de vídeo de 5 s elegida en el primer plano.
op = req("POST", "/api/operaciones", {
    "destino_tipo": "plano", "destino_id": p1["id"], "accion": "generar_video",
    "modelo": "sim-video", "duracion_s": 5,
})["operacion"]
req("POST", f"/api/operaciones/{op['id']}/autorizar", {})
for _ in range(80):
    o = next(x for x in req("GET", f"/api/operaciones?destino_id={p1['id']}") if x["id"] == op["id"])
    if o["estado"] == "completada":
        break
    time.sleep(0.5)
ok(o["estado"] == "completada", "toma de vídeo producida para el primer plano")
toma = next(t for t in req("GET", f"/api/planos/{p1['id']}/tomas")["tomas"] if t["operacion_id"] == op["id"])
req("POST", f"/api/tomas/{toma['id']}/elegir")

m = req("GET", f"/api/piezas/{PZ}/montaje")
ok(m["proyecto"]["fps"] in (24, 25, 30), f"el montaje sabe los fps del proyecto ({m['proyecto']['fps']})")
primero = next(x for x in m["planos"] if x["plano_id"] == p1["id"])
segundo = next(x for x in m["planos"] if x["plano_id"] == p2["id"])
ok(primero["toma"] and primero["fuente_duracion"] == "toma" and abs(primero["duracion_s"] - 5) < 0.1,
   f"con toma elegida, el plano dura lo que su toma ({primero['duracion_s']} s)")
ok(abs(segundo["inicio_s"] - (primero["inicio_s"] + primero["duracion_s"])) < 0.01,
   "el plano siguiente empieza donde acaba el anterior")
ok(segundo["toma"] is None or segundo["fuente_duracion"] == "toma", "un plano sin toma sale como hueco")
ok(abs(m["duracion_total_s"] - sum(x["duracion_s"] for x in m["planos"])) < 0.01,
   "la duración total es la suma de los planos")
etiquetas = [x["etiqueta"] for x in m["planos"]]
ok(etiquetas[0].startswith("E1·"), f"los planos van en orden de guion: {etiquetas[:4]}")
if segundo["toma"] is None:
    ok(any(segundo["etiqueta"] in a and "hueco" in a for a in m["avisos"]), "aviso del hueco")
for v in m["voces"]:
    base = next(x for x in m["planos"] if x["plano_id"] == v["plano_id"])
    ok(abs(v["inicio_s"] - (base["inicio_s"] + v["desfase_s"])) < 0.01,
       f"la voz de {v['hablante_nombre']} empieza en su plano más el desfase")

print("\nLínea de tiempo del montaje: todo en orden.")
