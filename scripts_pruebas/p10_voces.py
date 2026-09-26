"""Prueba de la Fase 7 · voces por diálogo (§3.1 «Voz», §11.1).
Solo contra la base de pruebas (cerrojo en comun.py)."""
import os
import sys
import time

import requests  # noqa: E402

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, req  # noqa: E402

PZ = os.environ["PZ"]
CORTO = os.environ["CORTO"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def estado_http(metodo, ruta, cuerpo):
    return requests.request(metodo, f"{API}{ruta}", json=cuerpo, timeout=60).status_code


def planos_de(escena_id):
    lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
    bloque = next(b for b in lienzo["escenas"] if b["escena"]["id"] == escena_id)
    return sorted(bloque["planos"], key=lambda p: p["orden"])


def esperar(op_id, limite=60):
    for _ in range(int(limite / 0.5)):
        op = next(o for o in req("GET", f"/api/operaciones?proyecto_id={CORTO}") if o["id"] == op_id)
        if op["estado"] in ("completada", "fallida", "incierta"):
            return op
        time.sleep(0.5)
    ok(False, f"la operación se ha quedado en «{op['estado']}»")


def revisar(cambiar):
    """Abre una revisión, aplica `cambiar(escenas)` y la aprueba marcando todo
    como «Solo texto»."""
    req("POST", f"/api/piezas/{PZ}/guion/revision")
    g = req("GET", f"/api/piezas/{PZ}/guion")
    cambiar(g["escenas"])
    dif = req("GET", f"/api/piezas/{PZ}/guion/diferencias")
    marcas = {e["escena_id"]: "solo_texto" for e in dif["editadas"]}
    return req("POST", f"/api/piezas/{PZ}/guion/revision/aprobar", {"marcas": marcas})


g0 = req("GET", f"/api/piezas/{PZ}/guion")
if g0["guion"]["estado"] != "aprobado":
    # Autosuficiente: si se ejecuta sola, deja el guion de la semilla aprobado.
    for e in g0["escenas"]:
        req("PATCH", f"/api/escenas/{e['id']}", {
            "titulo": e["titulo"] or "Escena", "que_ocurre": e["que_ocurre"] or "Pasa algo.",
            "updated_at": e["updated_at"],
        })
    req("POST", f"/api/piezas/{PZ}/guion/aprobar")
ok(req("GET", f"/api/piezas/{PZ}/guion")["guion"]["estado"] == "aprobado", "guion aprobado de partida")

reparto = req("GET", f"/api/proyectos/{CORTO}/reparto")
pers = next(r for r in reparto if r["elemento"]["clase"] == "personaje")
TEXTO = "Esta es para ti, mar, y para nadie más en todo el pueblo."


def poner_dialogos(escenas):
    e = escenas[0]
    req(
        "PATCH",
        f"/api/escenas/{e['id']}",
        {
            "titulo": e["titulo"] or "Escena con voces",
            "que_ocurre": e["que_ocurre"] or "Dos voces.",
            "elementos": sorted(set((e.get("elementos") or []) + [pers["id"]])),
            "dialogos": [
                {"hablante": pers["elemento_id"], "texto": TEXTO},
                {"hablante": "narrador", "texto": "Aquel día cerró el taller."},
            ],
            "updated_at": e["updated_at"],
        },
    )


revisar(poner_dialogos)
g = req("GET", f"/api/piezas/{PZ}/guion")
esc = g["escenas_aprobadas"][0]
ids = [d.get("id") for d in esc["dialogos"]]
ok(len(ids) == 2 and all(ids), "los diálogos aprobados tienen id")

# --- el id sobrevive a una revisión -------------------------------------------
revisar(lambda escenas: req(
    "PATCH",
    f"/api/escenas/{escenas[1]['id']}",
    {"que_ocurre": "Otra cosa en la escena 2.", "updated_at": escenas[1]["updated_at"]},
))
g = req("GET", f"/api/piezas/{PZ}/guion")
esc = next(e for e in g["escenas_aprobadas"] if e["id"] == esc["id"])
ok([d["id"] for d in esc["dialogos"]] == ids, "los ids de los diálogos se conservan tras otra revisión")

# --- planos de la escena --------------------------------------------------------
while len(planos_de(esc["id"])) < 2:
    req("POST", f"/api/escenas/{esc['id']}/planos", {})
planos_escena = planos_de(esc["id"])
primero = planos_escena[0]
req("PATCH", f"/api/planos/{primero['id']}", {"duracion_s": 2, "updated_at": primero["updated_at"]})

voces = req("GET", f"/api/escenas/{esc['id']}/voces")["voces"]
ok(len(voces) == 2, "la escena devuelve una voz por diálogo")
voz = next(v for v in voces if v["dialogo_id"] == ids[0])
ok(voz["plano_id"] == primero["id"] and voz["desfase_s"] == 0,
   "por defecto la voz suena en el primer plano de la escena, desfase 0")
ok(voz["hablante_nombre"] == pers["elemento"]["nombre"], "la voz sabe quién habla")

# --- producir la voz ------------------------------------------------------------
ok(estado_http("POST", "/api/operaciones", {
    "destino_tipo": "dialogo", "destino_id": ids[0], "accion": "generar_video", "modelo": "sim-video",
}) == 422, "sobre un diálogo solo se produce voz (422 con otra acción)")

prep = req("POST", "/api/operaciones", {
    "destino_tipo": "dialogo", "destino_id": ids[0], "accion": "generar_voz", "modelo": "sim-voz",
})
op = prep["operacion"]
esperado = round(len(TEXTO) * 0.002, 2)
ok(op["estado"] == "presupuestada", "la voz se queda preparada: no se envía nada sin autorizar")
ok(op["coste_estimado"] == esperado, f"coste = caracteres × 0,002 $ ({op['coste_estimado']} = {esperado})")
ok(op["destino"]["tipo"] == "dialogo", "el destino de la operación es el diálogo")

tomas_plano_antes = req("GET", f"/api/planos/{primero['id']}/tomas")
req("POST", f"/api/operaciones/{op['id']}/autorizar", {})
fin = esperar(op["id"])
ok(fin["estado"] == "completada", "voz producida")
ok(fin["destino_etiqueta"].startswith("Voz · "), f"el registro la etiqueta como voz: {fin['destino_etiqueta']}")

voz = next(v for v in req("GET", f"/api/escenas/{esc['id']}/voces")["voces"] if v["dialogo_id"] == ids[0])
ok(len(voz["tomas"]) == 1 and voz["tomas"][0]["texto_usado"] == TEXTO, "toma de voz con el texto usado")
ok(voz["tomas"][0]["duracion_s"] and voz["tomas"][0]["duracion_s"] > 2, "la voz dura según el texto")
tomas_plano = req("GET", f"/api/planos/{primero['id']}/tomas")
ok(len(tomas_plano) == len(tomas_plano_antes), "las tomas de voz no se mezclan con las del plano")

# --- elegir -------------------------------------------------------------------------
vista = req("POST", f"/api/tomas/{voz['tomas'][0]['id']}/elegir")
ok(vista["toma_elegida_id"] == voz["tomas"][0]["id"], "la toma de voz queda elegida en su voz")
plano_despues = next(p for p in planos_de(esc["id"]) if p["id"] == primero["id"])
ok(plano_despues.get("toma_elegida_id") == primero.get("toma_elegida_id"),
   "elegir una voz no toca la toma elegida del plano")
ok(any("más de lo que queda del plano" in a for a in vista["avisos"]),
   "aviso: la voz dura más que su plano (2 s)")

# --- plano y desfase ------------------------------------------------------------------
otra = req("GET", f"/api/piezas/{PZ}/guion")["escenas_aprobadas"][1]
ajeno = req("POST", f"/api/escenas/{otra['id']}/planos", {})
ok(estado_http("PATCH", f"/api/voces/{ids[0]}", {"plano_id": ajeno["id"]}) == 409,
   "una voz no puede sonar en un plano de otra escena (409)")
ok(estado_http("PATCH", f"/api/voces/{ids[0]}", {"desfase_s": -1}) == 422,
   "el desfase no puede ser negativo (422)")
vista = req("PATCH", f"/api/voces/{ids[0]}", {"plano_id": planos_escena[1]["id"], "desfase_s": 0.5})
ok(vista["plano_id"] == planos_escena[1]["id"] and vista["desfase_s"] == 0.5, "la voz se mueve de plano y desfase")

# --- el diálogo cambia: voz desactualizada ------------------------------------------------
def cambiar_texto(escenas):
    e = next(x for x in escenas if x.get("origen_id") == esc["id"])
    dialogos = [dict(d) for d in e["dialogos"]]
    dialogos[0]["texto"] = TEXTO + " Adiós."
    req("PATCH", f"/api/escenas/{e['id']}", {"dialogos": dialogos, "updated_at": e["updated_at"]})


revisar(cambiar_texto)
voz = next(v for v in req("GET", f"/api/escenas/{esc['id']}/voces")["voces"] if v["dialogo_id"] == ids[0])
ok(voz["desactualizada"], "si el texto del diálogo cambia, la voz elegida queda desactualizada")
ok(voz["toma_elegida_id"] is not None, "la toma elegida se conserva (el usuario decide)")

# --- el diálogo desaparece: voz sin diálogo ------------------------------------------------
def quitar_dialogo(escenas):
    e = next(x for x in escenas if x.get("origen_id") == esc["id"])
    req("PATCH", f"/api/escenas/{e['id']}", {"dialogos": [e["dialogos"][1]], "updated_at": e["updated_at"]})


revisar(quitar_dialogo)
pieza = req("GET", f"/api/piezas/{PZ}/voces")
ok(any(v["id"] == ids[0] for v in pieza["sin_dialogo"]), "la voz de un diálogo borrado se conserva como «sin diálogo»")
ok(all(v["dialogo_id"] != ids[0] for v in pieza["voces"]), "y ya no aparece entre las voces del guion")

print("\nVoces por diálogo: todo en orden.")
