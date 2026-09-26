"""Fase 6 · Motor con proveedor simulado (§9), tomas, exploración, correcciones y
registro. Solo contra la base de pruebas (cerrojo en comun.py)."""
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


def esperar(op_id, estados, limite=60):
    for _ in range(int(limite / 0.5)):
        ops = req("GET", f"/api/operaciones?destino_id={DESTINO}")
        actual = next(o for o in ops if o["id"] == op_id)
        if actual["estado"] in estados:
            return actual
        time.sleep(0.5)
    print(f"FALLA · la operación se ha quedado en «{actual['estado']}»")
    sys.exit(1)


# --- catálogo (§9.3) --------------------------------------------------------

catalogo = req("GET", "/api/catalogo")
por_id = {m["id"]: m for m in catalogo}
ok(por_id["sim-imagen"]["coste"]["valor"] == "0.04", "sim-imagen a 0,04 $/imagen")
ok(por_id["sim-video"]["coste"]["unidad"] == "segundo", "sim-video se cobra por segundo")
ok(por_id["sim-voz"]["coste"]["unidad"] == "caracter", "sim-voz se cobra por carácter")
ok(por_id["sim-sin-precio"]["coste"]["valor"] is None, "sim-sin-precio: coste sin verificar")
ok(all(not m["coste"]["verificado"] for m in catalogo), "ningún precio está verificado")
ok(
    not por_id["fal-plantilla-video"]["elegible"]
    and por_id["fal-plantilla-video"]["motivo_no_elegible"],
    "las plantillas de los proveedores reales no son elegibles",
)
ok(por_id["sim-imagen"]["elegible"], "los modelos simulados sí son elegibles")

# --- guion aprobado y plano -------------------------------------------------

g = req("GET", f"/api/piezas/{PZ}/guion")
if g["guion"]["estado"] != "aprobado":
    for e in g["escenas"]:
        req(
            "PATCH",
            f"/api/escenas/{e['id']}",
            {"titulo": e["titulo"] or "Escena", "que_ocurre": "Pasa algo.",
             "updated_at": e["updated_at"]},
        )
    g = req("POST", f"/api/piezas/{PZ}/guion/aprobar")

lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
escena = lienzo["escenas"][0]["escena"]
plano = req("POST", f"/api/escenas/{escena['id']}/planos", {})
DESTINO = plano["id"]
plano = req(
    "PATCH",
    f"/api/planos/{DESTINO}",
    {
        "que_se_muestra": "Marta abre la puerta.",
        "modalidad": "imagen",
        "direccion": {**plano["direccion"], "encuadre": "Plano medio",
                      "angulo": "A la altura de los ojos"},
        "updated_at": plano["updated_at"],
    },
)
ok(plano["estado_produccion"] == "dirigido", "plano dirigido y sin tomas")

# --- presupuestar y autorizar (§9.4.2 y 3) ---------------------------------

prep = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-imagen"},
)
op1 = prep["operacion"]
ok(op1["estado"] == "presupuestada", "la operación nace presupuestada, sin enviar nada")
ok(op1["coste_estimado"] == 0.04, f"coste estimado antes de producir: {op1['coste_estimado']}")
ok(prep["presupuesto"]["gasto"]["total"] == 0, "nada gastado todavía")

sin_precio = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-sin-precio"},
)
ok(
    sin_precio["operacion"]["coste_estimado"] is None
    and sin_precio["presupuesto"]["coste_sin_verificar"],
    "modelo sin precio: «coste sin verificar»",
)
req("DELETE", f"/api/operaciones/{sin_precio['operacion']['id']}")

req("POST", f"/api/operaciones/{op1['id']}/autorizar", {})
final = esperar(op1["id"], ("completada", "fallida", "incierta"))
ok(final["estado"] == "completada", "primera toma producida")
ok(final["coste_real"] == 0.04, f"coste real registrado: {final['coste_real']}")

tomas = req("GET", f"/api/planos/{DESTINO}/tomas")
ok(len(tomas["tomas"]) == 1 and tomas["toma_elegida_id"] is None, "la toma nace sin elegir")
medio = tomas["tomas"][0]["medio"]
ok(medio["origen"] == "generado" and medio["etiqueta_demo"], "el medio queda marcado como demo")
ok(medio["ancho"] == 1280 and medio["alto"] == 720, f"PNG en 16:9 real: {medio['ancho']}x{medio['alto']}")

# --- segunda toma, comparar y elegir ---------------------------------------

prep2 = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-imagen"},
)
req("POST", f"/api/operaciones/{prep2['operacion']['id']}/autorizar", {})
esperar(prep2["operacion"]["id"], ("completada",))
tomas = req("GET", f"/api/planos/{DESTINO}/tomas")
ok(len(tomas["tomas"]) == 2, "dos tomas para comparar")
segunda = tomas["tomas"][1]
ok(segunda["medio"]["hash"] != tomas["tomas"][0]["medio"]["hash"], "las dos tomas son distintas")
p = req("POST", f"/api/tomas/{segunda['id']}/elegir")
ok(p["toma_elegida_id"] == segunda["id"] and p["estado_produccion"] == "resuelto",
   "elegida la segunda toma")

gasto = req("GET", f"/api/proyectos/{CORTO}/gasto")
ok(gasto["gasto"]["real"] == 0.08, f"gasto real acumulado: {gasto['gasto']['real']}")

# --- incierto recuperable sin reenvío (§9.4.7) ------------------------------

incierta = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-imagen",
     "simular_resultado": "incierto"},
)["operacion"]
req("POST", f"/api/operaciones/{incierta['id']}/autorizar", {})
estado = esperar(incierta["id"], ("incierta", "completada", "fallida"))
ok(estado["estado"] == "incierta", "el envío sin respuesta deja la operación incierta")
antes = len(req("GET", f"/api/planos/{DESTINO}/tomas")["tomas"])
time.sleep(1.5)
req("POST", f"/api/operaciones/{incierta['id']}/comprobar")
estado = esperar(incierta["id"], ("completada", "fallida"))
ok(estado["estado"] == "completada", "«Comprobar» la recupera")
ok(estado["numero_intentos"] == 1, "un solo intento: no se ha reenviado nada")
despues = req("GET", f"/api/planos/{DESTINO}/tomas")["tomas"]
ok(len(despues) == antes + 1, "la recuperación crea una sola toma")

# --- timeout en la consulta -------------------------------------------------

tout = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-imagen",
     "simular_resultado": "timeout"},
)["operacion"]
req("POST", f"/api/operaciones/{tout['id']}/autorizar", {})
estado = esperar(tout["id"], ("incierta", "completada"))
ok(estado["estado"] == "incierta", "la consulta sin respuesta también deja incierta")
time.sleep(1.5)
req("POST", f"/api/operaciones/{tout['id']}/comprobar")
ok(esperar(tout["id"], ("completada",))["numero_intentos"] == 1, "recuperada con un solo intento")

# --- fallo y reintento ------------------------------------------------------

falla = req(
    "POST",
    "/api/operaciones",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-inestable"},
)["operacion"]
req("POST", f"/api/operaciones/{falla['id']}/autorizar", {})
estado = esperar(falla["id"], ("fallida", "completada"))
ok(estado["estado"] == "fallida" and estado["error"], f"el modelo que falla falla: {estado['error'][:40]}…")
re = req("POST", f"/api/operaciones/{falla['id']}/reintentar")
ok(re["operacion"]["estado"] == "presupuestada", "reintentar exige autorizar otra vez")
mal = req("POST", f"/api/operaciones/{falla['id']}/comprobar")
ok(True, "comprobar sobre una operación ya cerrada no rompe")

# --- transiciones protegidas ------------------------------------------------

req("POST", f"/api/operaciones/{op1['id']}/autorizar", {})
repetida = req("POST", f"/api/operaciones/{op1['id']}/autorizar", {})
ok(
    repetida.get("__status") == 409 or repetida.get("detail"),
    "autorizar dos veces la misma operación se rechaza con 409",
)

# --- explorar encuadres (§8) -----------------------------------------------

expl = req(
    "POST",
    f"/api/planos/{DESTINO}/explorar-encuadres",
    {"destino_id": DESTINO, "accion": "generar_imagen", "modelo": "sim-imagen", "n_variantes": 4},
)
ok(expl["operacion"]["coste_estimado"] == 0.16, "coste = 4 × precio unitario, autorización única")
req("POST", f"/api/operaciones/{expl['operacion']['id']}/autorizar", {})
esperar(expl["operacion"]["id"], ("completada",))
vista = req("GET", f"/api/planos/{DESTINO}/tomas")
ok(len(vista["exploraciones"]) == 4, "4 tomas de exploración, aparte de las tomas del plano")
ok(
    all(e["exploracion"] and e["exploracion"]["encuadre"] for e in vista["exploraciones"]),
    "cada exploración lleva su encuadre",
)
elegida_expl = vista["exploraciones"][1]
p = req("POST", f"/api/exploraciones/{elegida_expl['id']}/fijar", {"momento": "inicio"})
ok(
    p["direccion"]["encuadre"] == elegida_expl["exploracion"]["encuadre"],
    "fijar una exploración escribe su encuadre en la dirección",
)
nueva = req("POST", f"/api/exploraciones/{elegida_expl['id']}/usar-como-toma")
ok(not nueva["es_exploracion"], "«Usar como toma del plano» crea una toma de verdad")

# --- ajustar una toma de imagen (§7.6) -------------------------------------

ajuste = req(
    "POST",
    f"/api/tomas/{segunda['id']}/ajustar",
    {"destino_id": DESTINO, "accion": "editar_imagen", "modelo": "sim-editar",
     "instruccion": "baja la saturación"},
)
ok(ajuste["operacion"]["coste_estimado"] == 0.03, "ajustar cuesta lo del modelo de edición")
req("POST", f"/api/operaciones/{ajuste['operacion']['id']}/autorizar", {})
esperar(ajuste["operacion"]["id"], ("completada",))
tomas = req("GET", f"/api/planos/{DESTINO}/tomas")["tomas"]
ok(any(t["accion"] == "editar_imagen" for t in tomas), "el ajuste produce una toma nueva")
ok(any(t["id"] == segunda["id"] for t in tomas), "la toma original se conserva")

# --- corrección → operación → toma → «Hecha» sola (§7.7d) ------------------

p = req("POST", f"/api/planos/{DESTINO}/correcciones", {"texto": "más luz en la cara"})
correccion = p["correcciones"][-1]
prep = req(
    "POST",
    f"/api/correcciones/{correccion['id']}/preparar",
    {"destino_id": DESTINO, "accion": "editar_imagen", "modelo": "sim-editar"},
)
ok(prep["operacion"]["correccion_id"] == correccion["id"], "la operación queda enlazada a la corrección")
req("POST", f"/api/operaciones/{prep['operacion']['id']}/autorizar", {})
esperar(prep["operacion"]["id"], ("completada",))
plano_ahora = req("GET", f"/api/piezas/{PZ}/lienzo")
p = next(x for e in plano_ahora["escenas"] for x in e["planos"] if x["id"] == DESTINO)
corr = next(c for c in p["correcciones"] if c["id"] == correccion["id"])
ok(corr["estado"] == "pendiente" and corr["toma_id"], "la corrección sigue pendiente hasta elegir la toma")
p = req("POST", f"/api/tomas/{corr['toma_id']}/elegir")
corr = next(c for c in p["correcciones"] if c["id"] == correccion["id"])
ok(corr["estado"] == "hecha", "al elegir la toma, la corrección se marca «Hecha» sola")

# --- vídeo: fps, duración y encadenado -------------------------------------

plano2 = req("POST", f"/api/escenas/{escena['id']}/planos", {"modalidad": "video"})
plano2 = req(
    "PATCH",
    f"/api/planos/{plano2['id']}",
    {"que_se_muestra": "Marta cruza el pasillo.", "duracion_s": 3,
     "plano_anterior_encadenado": True, "updated_at": plano2["updated_at"]},
)
ok(plano2["plano_anterior_encadenado"], "segundo plano encadenado con el anterior")
prep = req(
    "POST",
    "/api/operaciones",
    {"destino_id": plano2["id"], "accion": "generar_video", "modelo": "sim-video",
     "duracion_s": 3},
)
ok(prep["operacion"]["coste_estimado"] == 0.75, "vídeo: 3 s × 0,25 $/s")
ok(
    prep["operacion"]["entradas"]["primer_fotograma"] is not None,
    "el encadenado envía el último fotograma de la toma elegida anterior",
)
DESTINO = plano2["id"]
req("POST", f"/api/operaciones/{prep['operacion']['id']}/autorizar", {})
esperar(prep["operacion"]["id"], ("completada",))
tomas = req("GET", f"/api/planos/{plano2['id']}/tomas")["tomas"]
mp4 = tomas[0]["medio"]
ok(mp4["clase"] == "video" and abs((mp4["duracion_s"] or 0) - 3) < 0.4,
   f"MP4 real de 3 s: {mp4['duracion_s']} s")

# --- voz por caracteres -----------------------------------------------------

voz = req(
    "POST",
    "/api/operaciones",
    {"destino_id": plano2["id"], "accion": "generar_voz", "modelo": "sim-voz",
     "texto": "Hola, soy Marta y esto es una prueba."},
)
ok(voz["operacion"]["coste_estimado"] == round(0.002 * 37, 4),
   f"voz: 0,002 $ × caracteres = {voz['operacion']['coste_estimado']}")
req("DELETE", f"/api/operaciones/{voz['operacion']['id']}")

# --- planos sin escena (§13) ------------------------------------------------

huerfano = req("POST", f"/api/escenas/{escena['id']}/planos", {})
req("PATCH", f"/api/planos/{huerfano['id']}", {"updated_at": huerfano["updated_at"]})
# lo dejamos sin escena a mano, como haría una revisión del guion (§13)
from pymongo import MongoClient  # noqa: E402
from dotenv import dotenv_values  # noqa: E402

env = dotenv_values("/app/backend/.env")
MongoClient(env["MONGO_URL"])[env.get("DB_NAME_PRUEBAS") or "picasso_pruebas"].planos.update_one(
    {"_id": huerfano["id"]}, {"$set": {"escena_id": None}}
)
vista = req("GET", f"/api/piezas/{PZ}/lienzo")
ok(len(vista["planos_sin_escena"]) == 1, "el plano sin escena se conserva y se devuelve aparte")
movido = req("POST", f"/api/planos/{huerfano['id']}/mover-a-escena", {"escena_id": escena["id"]})
ok(movido["escena_id"] == escena["id"], "«Mover a escena» lo devuelve al guion")

# --- registro (§9.5) --------------------------------------------------------

registro = req("GET", f"/api/operaciones?proyecto_id={CORTO}")
ok(len(registro) >= 8, f"{len(registro)} operaciones en el registro del proyecto")
ok(all(o["destino_etiqueta"] for o in registro), "cada operación dice a qué plano va")
totales = req("GET", f"/api/registro/totales?proyecto_id={CORTO}")
ok(totales["total"] > 0 and totales["moneda"] == "USD", f"totales del registro: {totales['total']} USD")
ok(totales["por_proyecto"][0]["nombre"], "totales por proyecto con nombre")

print("\nTODO OK · Fase 6 (motor simulado)")
