"""PIC-03 · La Mesa: versiones y ramas, Ajustar desde el Taller, id_peticion,
max_lote validado en el servidor, errores y costes por intento. Solo contra la
base de pruebas (cerrojo en comun.py). Solo modelos simulados."""
import hashlib
import os
import sys
import threading
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, elemento_aprobado, req  # noqa: E402

EP = os.environ["EP"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def post(ruta, cuerpo):
    r = requests.post(f"{API}{ruta}", json=cuerpo, timeout=60)
    return r.status_code, (r.json() if r.content else {})


def vista(carpeta):
    return req("GET", f"/api/carpetas/{carpeta}/tomas")


def esperar(carpeta, cond, que):
    for _ in range(160):
        v = vista(carpeta)
        if cond(v):
            return v
        time.sleep(0.25)
    ok(False, f"no llegó a tiempo: {que}")


def toma_de_op(v, op_id):
    return next((t for t in v["tomas"] if t["operacion_id"] == op_id), None)


def huella(medio_id):
    return hashlib.sha256(requests.get(f"{API}/api/medios/{medio_id}/archivo", timeout=30).content).hexdigest()


def operacion(op_id):
    return next(o for o in req("GET", f"/api/operaciones?espacio_id={EP}") if o["id"] == op_id)


def generar(carpeta, texto, pid, **extra):
    return post(f"/api/espacios/{EP}/taller/generar", {
        "carpeta_id": carpeta, "modelo": "sim-imagen", "texto": texto, "referencias": [], "relacion": "9:16",
        "cuantas": 1, "id_peticion": pid, **extra,
    })


def ajustar(toma, texto, pid, **extra):
    return post(f"/api/tomas/{toma['id']}/ajustar", {
        "destino_id": toma["carpeta_id"], "accion": "editar_imagen", "modelo": toma["modelo_edicion"],
        "instruccion": texto, "id_peticion": pid, **extra,
    })


carpeta = req("POST", f"/api/espacios/{EP}/carpetas", {"nombre": "Mesa p17"})["id"]
el = elemento_aprobado(EP, "personaje", "Juan Mesa")
ref = next(r for r in req("GET", f"/api/espacios/{EP}/taller")["referencias"] if r["nombre"] == "Juan Mesa")
texto_v1 = "Juan en su taller, foto realista"

# --- crear V1 con referencia y dirección; id_peticion -------------------------------
cuerpo = {"carpeta_id": carpeta, "modelo": "sim-imagen", "texto": texto_v1,
          "referencias": [{"medio_id": ref["medio_id"]}], "relacion": "9:16", "cuantas": 1,
          "id_peticion": "p17-v1", "direccion": {"encuadre": "Plano medio", "angulo": "A los ojos"}}
st, g1 = post(f"/api/espacios/{EP}/taller/generar", cuerpo)
ok(st == 201 and g1["operacion"]["estado"] == "autorizada", "Generar crea y autoriza V1 con el clic")
ok("Encuadre: Plano medio. Ángulo: A los ojos." in g1["operacion"]["prompt_visible"], "la dirección va al prompt enviado")
st, g1b = post(f"/api/espacios/{EP}/taller/generar", cuerpo)
ok(st == 200 and g1b["operacion"]["id"] == g1["operacion"]["id"] and g1b.get("repetida"),
   "el mismo id_peticion devuelve la misma operación (200), sin crear otra")
st, _ = generar(carpeta, "x " * 5, "p17-mala", direccion={"color": "rojo"})
ok(st == 422, "un control de dirección desconocido se rechaza")

# Doble clic simultáneo: dos POST a la vez con el mismo id_peticion → una operación.
resultados = []
hilos = [threading.Thread(target=lambda: resultados.append(generar(carpeta, "Una segunda raíz en la misma carpeta, foto realista", "p17-raiz2"))) for _ in range(2)]
[h.start() for h in hilos]
[h.join() for h in hilos]
ids = {r[1]["operacion"]["id"] for r in resultados}
ok(len(ids) == 1 and sorted(r[0] for r in resultados) in ([200, 201], [201, 201]) and any(r[1].get("repetida") for r in resultados),
   "dos POST simultáneos con el mismo id_peticion crean una sola operación")
raiz2_op = ids.pop()

# --- max_lote validado en el servidor ---------------------------------------------
lote = req("POST", f"/api/espacios/{EP}/carpetas", {"nombre": "Lote p17"})["id"]
gasto_antes = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
st, r = generar(lote, "Tres retratos de prueba en el estudio, foto realista", "p17-lote4", cuantas=4)
ok(st == 422 and "como mucho 3" in r.get("detail", ""), "sim-imagen (max_lote 3): pedir 4 da 422")
gasto_despues = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
ok(vista(lote)["en_marcha"] == [] and gasto_despues["reservado"] == gasto_antes["reservado"],
   "el lote rechazado no crea operación ni reserva")
st, r = generar(lote, "Tres retratos de prueba en el estudio, foto realista", "p17-lote3", cuantas=3)
ok(st == 201 and abs(float(r["operacion"]["coste_estimado"]) - 0.12) < 0.001, "pedir 3 presupuesta 3 × tarifa (0,12 $)")
modelos = {m["id"]: m for m in req("GET", f"/api/espacios/{EP}/taller")["modelos"]}
ok(modelos["sim-imagen"]["limite_lote"] == 3 and modelos["sim-inestable"]["limite_lote"] == 4,
   "el Taller expone el límite del lote por modelo (4 si el catálogo no lo fija)")

# --- V1 → V2 → V4; V1 → V3 -------------------------------------------------------
v = esperar(carpeta, lambda v: toma_de_op(v, g1["operacion"]["id"]) and toma_de_op(v, raiz2_op), "V1 y la segunda raíz")
v1 = toma_de_op(v, g1["operacion"]["id"])
ok(v1["origen_toma_id"] is None and v1["enviadas"]["referencias"] == [ref["medio_id"]] and v1["enviadas"]["imagen"] is None,
   "V1 es raíz y enviaron su referencia")
ok(v1["modelo_edicion"] == "sim-editar", "la versión dice con qué modelo se edita")
huella_v1, medio_v1 = huella(v1["medio_id"]), v1["medio_id"]

st, r = ajustar(v1, "", "p17-vacia")
ok(st == 422, "Ajustar sin instrucción se rechaza")
st, r = ajustar(v1, "ponle un sombrero", "p17-zona", zona="pies")
ok(st == 422, "una zona del cambio desconocida se rechaza")
st, r = post(f"/api/tomas/{v1['id']}/ajustar", {"destino_id": carpeta, "accion": "editar_imagen", "modelo": "sim-imagen", "instruccion": "x"})
ok(st == 422, "un modelo que no edita se rechaza")

st, e2 = ajustar(v1, "ponle un sombrero", "p17-v2", zona="cabeza")
op2 = e2["operacion"]
ok(st == 201 and op2["estado"] == "autorizada" and op2["accion"] == "editar_imagen" and op2["destino"] == {"tipo": "taller", "id": carpeta},
   "Ajustar desde el Taller edita en la misma carpeta y autoriza con el clic")
ok(op2["prompt_visible"].startswith("ponle un sombrero\nZona del cambio: la cabeza.\nAplica exactamente el cambio pedido"),
   "lo enviado lleva la instrucción, la zona y la cláusula de conservación")
st, e2b = ajustar(v1, "ponle un sombrero", "p17-v2", zona="cabeza")
ok(st == 200 and e2b["operacion"]["id"] == op2["id"], "el doble clic en Aplicar cambio no crea otra edición")

v = esperar(carpeta, lambda v: toma_de_op(v, op2["id"]), "V2")
v2 = toma_de_op(v, op2["id"])
ok(v2["origen_toma_id"] == v1["id"] and v2["texto"] == "ponle un sombrero" and v2["direccion"] == {"zona": "cabeza"},
   "V2 sale de V1 con la instrucción tal cual y la zona")
ok(v2["enviadas"] == {"imagen": medio_v1, "referencias": []}, "a V2 solo se le envió la imagen de V1")
v1_ahora = next(t for t in v["tomas"] if t["id"] == v1["id"])
ok(v1_ahora["medio_id"] == medio_v1 and huella(medio_v1) == huella_v1, "V1 queda intacta: mismo medio y mismo fichero")
ok(v2["medio_id"] != medio_v1, "V2 es un medio nuevo")

st, e3 = ajustar(v1, "cambia el fondo a una playa", "p17-v3")
st4, e4 = ajustar(v2, "que sonría", "p17-v4")
v = esperar(carpeta, lambda v: toma_de_op(v, e3["operacion"]["id"]) and toma_de_op(v, e4["operacion"]["id"]), "V3 y V4")
v3, v4 = toma_de_op(v, e3["operacion"]["id"]), toma_de_op(v, e4["operacion"]["id"])
ok(v3["origen_toma_id"] == v1["id"] and v4["origen_toma_id"] == v2["id"], "rama V3 desde V1 y V4 desde V2")
ok(v4["enviadas"]["imagen"] == v2["medio_id"], "a V4 se le envió la imagen de V2")
st, _ = post(f"/api/operaciones/{e4['operacion']['id']}/autorizar", {})
ok(st == 409, "autorizar dos veces la misma operación se rechaza")

# --- ★, descartar y nota persisten -----------------------------------------------
req("PATCH", f"/api/tomas/{v1['id']}", {"valoracion": "buena", "nota": "la buena"})
req("PATCH", f"/api/tomas/{v2['id']}", {"valoracion": "buena"})
req("PATCH", f"/api/tomas/{v3['id']}", {"valoracion": "descartada"})
a, b = vista(carpeta), vista(carpeta)
ok(a["tomas"] == b["tomas"], "dos lecturas seguidas de la carpeta son idénticas")
por_id = {t["id"]: t for t in a["tomas"]}
ok(por_id[v1["id"]]["valoracion"] == "buena" and por_id[v2["id"]]["valoracion"] == "buena", "varias ★ a la vez")
ok(por_id[v3["id"]]["valoracion"] == "descartada" and por_id[v1["id"]]["nota"] == "la buena", "descartar y la nota se guardan")
ok(len(a["tomas"]) == 5, "la carpeta tiene las cinco versiones: V1, otra raíz, V2, V3 y V4 (nada sobrescrito)")

# --- errores: falló, reintento con autorización nueva ------------------------------
st, ef = ajustar(v1, "ponle gafas", "p17-falla", simular_resultado="fallo")
opf = ef["operacion"]["id"]
v = esperar(carpeta, lambda v: any(o["id"] == opf and o["estado"] == "fallida" for o in v["en_marcha"]), "la edición fallida")
of = next(o for o in v["en_marcha"] if o["id"] == opf)
ok(of["origen_toma_id"] == v1["id"] and of["texto"] == "ponle gafas" and of["error"], "la tarjeta de error cuelga de su origen y dice por qué")
clave1 = operacion(opf)["clave_idempotencia"]
st, r = post(f"/api/operaciones/{opf}/reintentar", {})
ok(st == 200 and r["operacion"]["estado"] == "presupuestada" and r["operacion"]["clave_idempotencia"] != clave1,
   "reintentar deja la operación presupuestada, con clave nueva")
v = vista(carpeta)
ok(any(o["id"] == opf and o["estado"] == "presupuestada" and o["intentos"] >= 1 for o in v["en_marcha"]),
   "el reintento espera la autorización en la Mesa (no se envía solo)")
st, r = post(f"/api/operaciones/{opf}/autorizar", {})
ok(st == 200 and r["operacion"]["estado"] == "autorizada", "el reintento se envía solo tras autorizar otra vez")
esperar(carpeta, lambda v: any(o["id"] == opf and o["estado"] == "fallida" for o in v["en_marcha"]), "el reintento vuelve a fallar")
req("POST", f"/api/operaciones/{opf}/visto")
ok(all(o["id"] != opf for o in vista(carpeta)["en_marcha"]), "«Quitar» saca la tarjeta fallida de la Mesa")

# --- sin confirmar: comprobar nunca reenvía; marcar fallida deja posible cargo por intento
st, ei = generar(carpeta, "Prueba de envío sin respuesta, foto realista", "p17-inc", simular_resultado="incierto")
opi = ei["operacion"]["id"]
esperar(carpeta, lambda v: any(o["id"] == opi and o["estado"] == "incierta" for o in v["en_marcha"]), "la operación incierta")
st, r = post(f"/api/operaciones/{opi}/comprobar", {})
ok(st == 200, "Comprobar consulta el trabajo registrado")
v = esperar(carpeta, lambda v: toma_de_op(v, opi), "la toma tras comprobar")
ok(operacion(opi).get("intentos") == 1, "Comprobar no reenvió: un solo intento")

st, ei2 = generar(carpeta, "Otra prueba sin respuesta, foto realista", "p17-inc2", simular_resultado="incierto")
opi2 = ei2["operacion"]["id"]
esperar(carpeta, lambda v: any(o["id"] == opi2 and o["estado"] == "incierta" for o in v["en_marcha"]), "la segunda incierta")
post(f"/api/operaciones/{opi2}/marcar-fallida", {})
v = vista(carpeta)
oi2 = next(o for o in v["en_marcha"] if o["id"] == opi2)
cargos = oi2["coste"]["cargos"]
ok(oi2["estado"] == "fallida" and len(cargos) == 1 and cargos[0]["estado"] == "pendiente" and cargos[0]["numero"] == 1,
   "marcada fallida, la Mesa enseña el posible cargo del intento 1")
post(f"/api/operaciones/{opi2}/reintentar", {})
post(f"/api/operaciones/{opi2}/autorizar", {})
v = vista(carpeta)
oi2 = next(o for o in v["en_marcha"] if o["id"] == opi2)
ok(any(c["numero"] == 1 and c["estado"] == "pendiente" for c in oi2["coste"]["cargos"]),
   "el reintento no oculta el posible cargo del intento anterior")
g = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
ok(g["posible_cargo"] > 0 and g["reservado"] > 0, "el gasto del Taller separa reservado y posible cargo")

# --- respuesta perdida: el servidor aceptó, el cliente no se enteró ---------------
st, r = generar(carpeta, "Respuesta perdida, foto realista", "p17-perdida")
op_perdida = r["operacion"]["id"]
st, rec = requests.get(f"{API}/api/espacios/{EP}/peticiones/p17-perdida", timeout=30).status_code, requests.get(f"{API}/api/espacios/{EP}/peticiones/p17-perdida", timeout=30).json()
ok(st == 200 and rec["operacion"]["id"] == op_perdida and rec["operacion"]["estado"] != "presupuestada",
   "tras recargar, la petición pendiente se reconcilia por su id_peticion: ya está creada y autorizada")
st, r = generar(carpeta, "Respuesta perdida, foto realista", "p17-perdida")
ok(st == 200 and r["operacion"]["id"] == op_perdida, "repetirla con el mismo id_peticion no crea otra imagen ni otro cargo")
ok(requests.get(f"{API}/api/espacios/{EP}/peticiones/p17-nunca-llego", timeout=30).status_code == 404,
   "una petición que nunca llegó da 404: se puede reenviar con el mismo identificador")
st, r = generar(carpeta, "La que nunca llegó, foto realista", "p17-nunca-llego")
ok(st == 201, "y el reenvío con ese mismo identificador crea la operación una sola vez")
esperar(carpeta, lambda v: toma_de_op(v, op_perdida), "la imagen de la respuesta perdida")

# --- superar el presupuesto: la operación queda sin autorizar y se recupera ----------
ajustes = req("GET", "/api/ajustes")
original = ajustes.get("presupuesto_por_defecto")
total = req("GET", f"/api/espacios/{EP}/taller")["gasto"]["total"]
req("PUT", "/api/ajustes", {"presupuesto_por_defecto": round(total + 0.01, 2)})
try:
    st, r = generar(carpeta, "Por encima del presupuesto, foto realista", "p17-presu")
    ok(st == 409 and "presupuesto" in r.get("detail", ""), "superar el presupuesto da 409 y pide confirmación")
    pend = req("GET", f"/api/espacios/{EP}/peticiones/p17-presu")["operacion"]
    ok(pend["estado"] == "presupuestada" and int(pend.get("intentos") or 0) == 0, "la operación quedó guardada sin autorizar ni enviar")
    ok(any(o["id"] == pend["id"] and o["estado"] == "presupuestada" for o in vista(carpeta)["en_marcha"]),
       "la Mesa enseña la operación sin autorizar (no queda oculta)")
    st, r = generar(carpeta, "Por encima del presupuesto, foto realista", "p17-presu")
    ok(st == 409, "repetir sin confirmar sigue pidiendo confirmación (no da éxito falso)")
    cuerpo_ok = {"carpeta_id": carpeta, "modelo": "sim-imagen", "texto": "Por encima del presupuesto, foto realista", "referencias": [],
                 "relacion": "9:16", "cuantas": 1, "id_peticion": "p17-presu", "confirmado_por_encima_del_presupuesto": True}
    res = []
    hilos = [threading.Thread(target=lambda: res.append(post(f"/api/espacios/{EP}/taller/generar", cuerpo_ok))) for _ in range(2)]
    [h.start() for h in hilos]
    [h.join() for h in hilos]
    ok(all(st == 200 and r["operacion"]["id"] == pend["id"] and r["operacion"]["estado"] != "presupuestada" for st, r in res),
       "repetir con confirmación (dos a la vez) autoriza la misma operación")
    v = esperar(carpeta, lambda v: toma_de_op(v, pend["id"]), "la imagen autorizada tras confirmar")
    ok(operacion(pend["id"]).get("intentos") == 1, "se envió una sola vez")

    st, e5 = ajustar(v1, "otra edición por encima del presupuesto", "p17-presu-edit")
    ok(st == 409, "Ajustar por encima del presupuesto también pide confirmación")
    pe = req("GET", f"/api/espacios/{EP}/peticiones/p17-presu-edit")["operacion"]
    st, r = post(f"/api/operaciones/{pe['id']}/autorizar", {"confirmado_por_encima_del_presupuesto": True})
    ok(st == 200 and r["operacion"]["estado"] == "autorizada", "desde la Mesa se autoriza con la confirmación")
    st, r = post(f"/api/operaciones/{pe['id']}/autorizar", {"confirmado_por_encima_del_presupuesto": True})
    ok(st == 409, "y no se autoriza dos veces")
finally:
    req("PUT", "/api/ajustes", {"presupuesto_por_defecto": original if original is not None else 1000})
