import csv
import io
import math
import os
import sys
import time
import uuid
from datetime import date, timedelta

import requests

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, elemento_aprobado, req, subir_imagen  # noqa: E402

EP = os.environ["EP"]
INSTR_BYTES = None


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def llamar(metodo, ruta, cuerpo=None):
    r = requests.request(metodo, f"{API}{ruta}", json=cuerpo, timeout=60)
    return r.status_code, (r.json() if r.content else {})


def envios():
    return req("GET", "/api/pruebas/mejorar/envios")["simulado"]


def parametros(**cuerpo):
    s, d = llamar("POST", "/api/pruebas/mejorar/parametros", cuerpo)
    ok(s == 200, f"parámetros de prueba aplicados {cuerpo if not cuerpo.get('restaurar') else '(restaurar)'}")
    return d


def carpeta_nueva(nombre):
    return req("POST", f"/api/espacios/{EP}/carpetas", {"nombre": nombre})["id"]


def borrador(nombre, texto="Una mujer en un mercado"):
    c = carpeta_nueva(nombre)
    s, b = llamar("POST", f"/api/espacios/{EP}/borradores", {"carpeta_id": c})
    ok(s == 201 and b["revision"] == 1, f"[{nombre}] borrador creado en su carpeta")
    s, b = llamar("PUT", f"/api/borradores/{b['id']}", {"revision": b["revision"], "texto": texto, "alcance": {"tipo": "nueva"}})
    ok(s == 200 and b["revision"] == 2 and b["texto"] == texto, f"[{nombre}] texto guardado y revisión confirmada ({b['revision']})")
    return b


def presupuesto(b, sim="normal", refs=(), modelo="sim-imagen", esperado=201):
    s, p = llamar(
        "POST",
        f"/api/borradores/{b['id']}/mejorar/presupuesto",
        {"revision": b["revision"], "referencias": [{"medio_id": r} for r in refs], "relacion": "9:16", "modelo_imagen": modelo, "simular_resultado": sim},
    )
    if esperado is not None:
        ok(s == esperado, f"presupuesto {sim}: {s} (esperado {esperado}) {'' if s == esperado else p}")
    return s, p


def pedir(b, p, id_peticion=None, esperado=201):
    s, v = llamar("POST", f"/api/borradores/{b['id']}/mejorar", {"presupuesto_id": p["id"], "id_peticion": id_peticion or str(uuid.uuid4())})
    if esperado is not None:
        ok(s == esperado, f"mejorar con presupuesto {p['id'][:8]}: {s} (esperado {esperado}) {'' if s == esperado else v}")
    return s, v


def mejoras(b):
    return req("GET", f"/api/borradores/{b['id']}/mejoras")


def mejora(b, op_id):
    return next(m for m in mejoras(b)["mejoras"] if m["id"] == op_id)


def esperar(b, op_id, cond, que, intentos=200):
    for _ in range(intentos):
        m = mejora(b, op_id)
        if cond(m):
            return m
        time.sleep(0.15)
    ok(False, f"no llegó a tiempo: {que} (estado {mejora(b, op_id)['estado']})")


def final(b, op_id):
    return esperar(b, op_id, lambda m: m["estado"] in ("completada", "fallida", "incierta"), "estado final")


def operacion_registro(op_id):
    return next(o for o in req("GET", f"/api/operaciones?espacio_id={EP}") if o["id"] == op_id)


def fila_csv(op):
    texto = requests.get(f"{API}/api/registro/exportar.csv?espacio_id={EP}", timeout=30).text
    filas = list(csv.DictReader(io.StringIO(texto), delimiter=";"))
    return next(f for f in filas if f["fecha"] == op["created_at"])


def lanzar(nombre, sim, texto="Una mujer en un mercado", refs=()):
    b = borrador(nombre, texto)
    _, p = presupuesto(b, sim, refs)
    _, v = pedir(b, p)
    return b, p, v["operacion"]["id"]


def reserva_formula(bytes_entrada, tarifa_entrada=2.5, salida_tokens=2000, tarifa_salida=10.0):
    valor = (bytes_entrada + 256) * tarifa_entrada / 1e6 + salida_tokens * tarifa_salida / 1e6
    return math.ceil(round(valor * 1e4, 6)) / 1e4


parametros(restaurar=True)

el = elemento_aprobado(EP, "personaje", "Marta")
nueva = req("POST", f"/api/elementos/{el['id']}/fichas")
req("PATCH", f"/api/fichas/{nueva['id']}", {"rasgos_fijos": ["pelo castaño corto", "pecas", "gafas redondas de pasta"], "updated_at": nueva["updated_at"]})
req("POST", f"/api/fichas/{nueva['id']}/aprobar")
refs_taller = {r["nombre"]: r for r in req("GET", f"/api/espacios/{EP}/taller")["referencias"]}
REF_MARTA = refs_taller["Marta"]["medio_id"]

print("\n— 1 · estimación y reserva estimada con todo lo enviado")
b = borrador("c1")
_, p_sin = presupuesto(b)
_, p_con = presupuesto(b, refs=[REF_MARTA])
ok(p_con["bytes_entrada"] > p_sin["bytes_entrada"] + len("pelo castaño corto; pecas; gafas redondas de pasta"), "las referencias con sus rasgos entran en los bytes medidos")
ok(p_sin["bytes_entrada"] > 1100 + len("Una mujer en un mercado"), "las instrucciones fijas y el texto entran en los bytes medidos")
ok(p_con["reserva_estimada"] == reserva_formula(p_con["bytes_entrada"]), f"reserva = (bytes + 256) × 2,50 + 2 000 × 10,00 por millón → {p_con['reserva_estimada']}")
ok(0 < p_con["estimacion"] < p_con["reserva_estimada"], f"estimación {p_con['estimacion']} por debajo de la reserva")
ok(p_con["configuracion"]["background"] is True and p_con["configuracion"]["store"] is True, "configuración con segundo plano y store (D3)")
s, bl = llamar("PUT", f"/api/borradores/{b['id']}", {"revision": b["revision"], "texto": "x" * 2001, "alcance": {"tipo": "nueva"}})
s, e = presupuesto(bl, esperado=422)
ok("2000" in str(e.get("detail")), "más de 2 000 caracteres → 422 explicando el límite")
cinco = [subir_imagen(EP, f"ref{i}.png")["id"] for i in range(5)]
b2 = borrador("c1b")
s, e = presupuesto(b2, refs=cinco, esperado=422)
ok("4" in str(e.get("detail")), "más referencias de las que admite el modelo elegido (4) → 422")

print("\n— 2 · doble clic y recarga")
b = borrador("c2")
_, p = presupuesto(b)
antes = envios()
idp = str(uuid.uuid4())
s1, v1 = pedir(b, p, idp)
s2, v2 = pedir(b, p, idp, esperado=200)
ok(v1["operacion"]["id"] == v2["operacion"]["id"] and v2.get("repetida"), "el mismo id_peticion devuelve la misma operación")
final(b, v1["operacion"]["id"])
ok(envios() == antes + 1, "un solo envío al proveedor")
ok(len(mejoras(b)["mejoras"]) == 1, "una sola propuesta en el borrador, recuperable al recargar")

print("\n— 3 · normal: según tarifa en estimado, propuesta al lado, aceptar, deshacer y descartar")
b, p, op = lanzar("c3", "normal")
m = final(b, op)
ok(m["estado"] == "completada" and m["resultado"]["calidad"] == "completa", "propuesta completa")
ok(m["coste"]["categoria"] == "estimado" and m["coste"]["informado"] is None and m["coste"]["segun_tarifa"] > 0, f"coste según tarifa {m['coste']['segun_tarifa']} en estimado, nunca informado")
bb = req("GET", f"/api/borradores/{b['id']}")
ok(bb["texto"] == "Una mujer en un mercado", "el original sigue intacto en la barra hasta aceptar")
s, r = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": bb["revision"]})
ok(s == 200 and r["borrador"]["texto"] == m["resultado"]["texto"] and r["borrador"]["revision"] == bb["revision"] + 1, "Aceptar: la propuesta entra como revisión nueva")
s, d = llamar("PUT", f"/api/borradores/{b['id']}", {"revision": r["borrador"]["revision"], "texto": r["anterior"], "alcance": {"tipo": "nueva"}})
ok(s == 200 and d["texto"] == "Una mujer en un mercado" and d["revision"] == r["borrador"]["revision"] + 1, "Deshacer: el texto anterior vuelve como otra revisión")
_, p2 = presupuesto(d)
_, v = pedir(d, p2)
final(d, v["operacion"]["id"])
s, x = llamar("POST", f"/api/borradores/{b['id']}/descartar", {"operacion_id": v["operacion"]["id"]})
ok(s == 200 and req("GET", f"/api/borradores/{b['id']}")["texto"] == "Una mujer en un mercado", "Descartar: la barra queda como estaba")
ok(mejora(d, v["operacion"]["id"])["coste"]["segun_tarifa"] > 0, "Descartar: el coste sigue contado")

print("\n— 3b · respuesta tardía con el borrador en otra revisión")
b, p, op = lanzar("c3b", "retenida")
bb = req("GET", f"/api/borradores/{b['id']}")
s, b_nuevo = llamar("PUT", f"/api/borradores/{b['id']}", {"revision": bb["revision"], "texto": "Otro texto distinto", "alcance": {"tipo": "nueva"}})
m = final(b, op)
ok(m["para_texto_anterior"] and m["revision"] == bb["revision"], f"propuesta para un texto anterior (revisión {m['revision']})")
ok(req("GET", f"/api/borradores/{b['id']}")["texto"] == "Otro texto distinto", "la barra no cambia sola")
s, e = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": b_nuevo["revision"]})
ok(s == 409 and e["detail"]["motivo"] == "anterior", "aceptarla pide confirmar «Sustituirá lo que tienes ahora»")
s, r = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": b_nuevo["revision"], "confirmado": True})
ok(s == 200 and r["borrador"]["texto"] == m["resultado"]["texto"], "con la confirmación, sí sustituye")
b, p, op = lanzar("c3b-alcance", "retenida")
bb = req("GET", f"/api/borradores/{b['id']}")
llamar("PUT", f"/api/borradores/{b['id']}", {"revision": bb["revision"], "texto": bb["texto"], "alcance": {"tipo": "editar", "toma_id": "t1"}})
ok(final(b, op)["para_texto_anterior"], "con otro alcance, también es para un texto anterior")

print("\n— 3c · editar una copia, recargar y revisión antigua")
b, p, op = lanzar("c3c", "incompleta")
m = final(b, op)
bb = req("GET", f"/api/borradores/{b['id']}")
s, c = llamar("PUT", f"/api/borradores/{b['id']}/copia", {"operacion_id": op, "texto": "Copia editada a mano"})
ok(s == 200 and c["copia_propuesta"]["texto"] == "Copia editada a mano" and c["texto"] == bb["texto"], "Editar antes de aceptar cambia la copia; la barra no cambia")
rec = req("GET", f"/api/espacios/{EP}/borradores?carpeta_id={bb['carpeta_id']}")
ok(rec["id"] == b["id"] and rec["copia_propuesta"]["operacion_id"] == op and len(rec["mejoras"]) == 1, "al recargar se recuperan el borrador, su mejora y la copia")
ok(mejora(b, op)["resultado"]["parcial"], "la propuesta se lee de su operación")
s, e = llamar("PUT", f"/api/borradores/{b['id']}", {"revision": bb["revision"] - 1, "texto": "viejo", "alcance": {"tipo": "nueva"}})
ok(s == 409 and e["detail"]["motivo"] == "revision", "PUT con una revisión antigua → 409")
s, r = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": bb["revision"], "usar_copia": True})
ok(s == 200 and r["borrador"]["texto"] == "Copia editada a mano" and r["borrador"]["copia_propuesta"] is None, "Aceptar la copia editada la pasa a la barra")

print("\n— 4 · incompleta")
b, p, op = lanzar("c4", "incompleta")
m = final(b, op)
n = envios()
ok(m["estado"] == "fallida" and "límite de salida (2000 tokens)" in m["error"], f"aviso: {m['error']}")
ok(m["coste"]["categoria"] == "estimado" and m["coste"]["segun_tarifa"] > 0 and m["coste"]["posible_cargo"] == 0, "consumo apuntado como estimado")
s, e = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": req('GET', f"/api/borradores/{b['id']}")["revision"]})
ok(s == 409, "sin Aceptar directo")
time.sleep(1.5)
ok(envios() == n and mejora(b, op)["intentos"] == 1, "ninguna llamada nueva")
s1, _ = llamar("POST", f"/api/operaciones/{op}/reintentar")
s2, _ = llamar("POST", f"/api/operaciones/{op}/autorizar")
ok(s1 == 409 and s2 == 409 and envios() == n, "el reintento y la autorización genéricos del motor no valen para una mejora: sin presupuesto, no hay llamada")

print("\n— 5 · rechazada (4xx)")
b, p, op = lanzar("c5", "rechazada")
m = final(b, op)
ok(m["estado"] == "fallida" and m["coste"]["categoria"] == "nada" and m["coste"]["posible_cargo"] == 0, "fallida, sin consumo ni posible cargo")
b, p, op = lanzar("c5-uso", "rechazada_con_consumo")
m = final(b, op)
ok(m["estado"] == "fallida" and m["coste"]["categoria"] == "estimado" and m["coste"]["segun_tarifa"] > 0, "con usage: el consumo queda en estimado")

print("\n— 5b · error 5xx al crear")
b, p, op = lanzar("c5b", "error_5xx")
m = final(b, op)
ok(m["estado"] == "incierta" and m["coste"]["categoria"] == "reservado" and m["coste"]["contado"] == p["reserva_estimada"], "incierta, nunca fallida, y la reserva se mantiene")

print("\n— 6 · incierta e incierta sin id")
b, p, op = lanzar("c6", "incierta")
m = esperar(b, op, lambda m: m["estado"] == "incierta", "incierta por plazo", 400)
ok("Sin final" in m["error"], f"motivo: {m['error']}")
time.sleep(1)
s, v = llamar("POST", f"/api/operaciones/{op}/comprobar")
m = esperar(b, op, lambda m: m["estado"] == "completada", "Comprobar la recupera")
ok(m["coste"]["segun_tarifa"] > 0, "Comprobar consulta por id y la completa sin reenviar")
b, p, op = lanzar("c6-falla", "incierta")
esperar(b, op, lambda m: m["estado"] == "incierta", "incierta", 400)
llamar("POST", f"/api/operaciones/{op}/marcar-fallida")
m = mejora(b, op)
ok(m["estado"] == "fallida" and m["coste"]["posible_cargo"] == p["reserva_estimada"], "marcada fallida: posible cargo = reserva estimada")
it = m["coste"]["cargos"][0]["intento_id"]
llamar("POST", f"/api/intentos/{it}/cargo", {"cobrado": False})
ok(mejora(b, op)["coste"]["posible_cargo"] == 0, "«No hubo cargo» lo resuelve")
b, p, op = lanzar("c6-sinid", "incierta_sin_id")
m = final(b, op)
ok(m["estado"] == "incierta" and "no llegó el identificador" in m["error"], "sin id: incierta y lo dice")
n = envios()
llamar("POST", f"/api/operaciones/{op}/comprobar")
m = mejora(b, op)
ok("no llegó el identificador" in m["error"] and envios() == n, "«Comprobar» sin id lo explica y no reenvía")
llamar("POST", f"/api/operaciones/{op}/marcar-fallida")
m = mejora(b, op)
ok(m["coste"]["posible_cargo"] == p["reserva_estimada"], "posible cargo = reserva estimada")
llamar("POST", f"/api/intentos/{m['coste']['cargos'][0]['intento_id']}/cargo", {"cobrado": True, "importe": 0.02})
m = mejora(b, op)
ok(m["coste"]["posible_cargo"] == 0 and m["coste"]["informado_cargos"] == 0.02, "«Hubo cargo…» lo lleva a informado")

print("\n— 7 · supera la reserva: marca, bloqueo y reactivación")
b, p, op = lanzar("c7", "supera_reserva")
m = final(b, op)
ok(any("superó la reserva" in x for x in m["marcas"]) and m["bloqueo"]["activo"], f"marca: {m['marcas']}")
b2 = borrador("c7b")
_, p2 = presupuesto(b2)
n = envios()
s, e = pedir(b2, p2, esperado=409)
ok(e["detail"]["motivo"] == "bloqueo" and envios() == n and not mejoras(b2)["mejoras"], "Mejorar bloqueado: ni operación ni llamada")
llamar("POST", f"/api/operaciones/{op}/mejorar/entendido")
s, v = pedir(b2, p2)
final(b2, v["operacion"]["id"])
ok(s == 201, "«Entendido, seguir» lo reactiva")

print("\n— 8 y 12 · dos intentos con consumo, el anterior visible mientras corre el siguiente")
gasto_antes = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
b, p, op = lanzar("c8", "incompleta")
m = final(b, op)
a = m["coste"]["segun_tarifa"]
s, pr = llamar("POST", f"/api/operaciones/{op}/mejorar/presupuesto", {"simular_resultado": "retenida"})
ok(s == 201 and pr["tipo"] == "reintento", f"presupuesto del reintento: reserva {pr['reserva_estimada']}")
r_ = pr["reserva_estimada"]
s, v = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": pr["id"]})
ok(s == 200, "Volver a pedir: clic nuevo con su presupuesto")
m = esperar(b, op, lambda m: m["estado"] in ("enviada", "en_curso"), "intento 2 en curso")
c = m["coste"]
ok(c["categoria"] == "reservado" and c["contado"] == r_ and c["estimado_adicional"] == a, f"Mesa: estimado {a} + reservado {r_}")
reg = operacion_registro(op)
lineas = reg["coste"]["intentos_mejora"]
ok(len(lineas) == 2 and lineas[0]["coste_segun_tarifa"] == a and lineas[1]["en_curso"] and lineas[1]["reserva"] == r_, "Registro: dos líneas, «según tarifa a» y «en curso · reserva r»")
fila = fila_csv(reg)
ok(float(fila["coste_segun_tarifa"]) == a and float(fila["reserva_en_curso"]) == r_, f"CSV: coste_segun_tarifa {fila['coste_segun_tarifa']} y reserva_en_curso {fila['reserva_en_curso']}")
g = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
ok(abs((g["estimado"] - gasto_antes["estimado"]) - a) <= 0.011 and abs((g["reservado"] - gasto_antes["reservado"]) - r_) <= 0.011, "totales del Taller: suben a en estimado y r en reservado")
m = esperar(b, op, lambda m: m["estado"] == "completada", "intento 2 completo")
bb = m["coste"]["segun_tarifa"] - a
ok(m["coste"]["categoria"] == "estimado" and m["coste"]["estimado_adicional"] == 0 and m["coste"]["reserva_en_curso"] is None, f"al terminar: estimado a + b = {m['coste']['segun_tarifa']}, sin reserva")
reg = operacion_registro(op)
fila = fila_csv(reg)
ok(float(fila["coste_segun_tarifa"]) == m["coste"]["segun_tarifa"] and fila["reserva_en_curso"] == "" and fila["intentos_con_consumo"] == "2", "CSV: suma a + b, sin reserva en curso y dos intentos con consumo")
ok(reg["coste"]["segun_tarifa"] == m["coste"]["segun_tarifa"], "Registro y Mesa dan lo mismo")
g2 = req("GET", f"/api/espacios/{EP}/taller")["gasto"]
ok(abs((g2["estimado"] - gasto_antes["estimado"]) - m["coste"]["segun_tarifa"]) <= 0.011 and abs(g2["reservado"] - gasto_antes["reservado"]) <= 0.011, "totales del Taller: a + b en estimado, sin reserva")

print("\n— 9 · tarifa: caché separada y razonamiento sin contar dos veces")
b, p, op = lanzar("c9", "escritura_cache")
m = final(b, op)
it = operacion_registro(op)["coste"]["intentos_mejora"][0]
t = it["tokens"]
esperado_9 = round((t["entrada_normal"] * 2.0 + t["cache_escritura_30m"] * 2.5 + t["salida"] * 10.0) / 1e6, 4)
ok(t["entrada_normal"] == 0 and t["cache_escritura"] > 0 and it["coste_segun_tarifa"] == esperado_9, f"entrada normal, escritura a 2,50 y salida separadas: {it['coste_segun_tarifa']} = {esperado_9}")
ok("escritura en caché no esperada" in m["marcas"] and m["bloqueo"]["activo"], "escritura no esperada: marcada y bloquea como supera_reserva")
llamar("POST", f"/api/operaciones/{op}/mejorar/entendido")
ok(t["razonamiento"] <= t["salida"] and it["coste_segun_tarifa"] == esperado_9, "el razonamiento va dentro de la salida y no se suma aparte")

print("\n— 10 · tarifa inmutable")
b, p, op = lanzar("c10", "normal")
m = final(b, op)
coste_10 = m["coste"]["segun_tarifa"]
parametros(tarifa={"salida": "20.00", "verificada_en": date.today().isoformat()})
m = mejora(b, op)
it = operacion_registro(op)["coste"]["intentos_mejora"][0]
ok(m["coste"]["segun_tarifa"] == coste_10 and it["tarifa_aplicada"]["salida"] == "10.00", "con otra tarifa en el código, el intento conserva la suya y su coste")
parametros(restaurar=True)

print("\n— 13 y 13b · presupuesto ligado a la autorización")
b = borrador("c13")
s, e = llamar("POST", f"/api/borradores/{b['id']}/mejorar/presupuesto", {"revision": b["revision"] - 1})
ok(s == 409 and e["detail"]["motivo"] == "revision", "presupuesto con una revisión que no es la actual → 409")
_, p = presupuesto(b, refs=[REF_MARTA])
ok(p["revision"] == b["revision"], "el presupuesto fija la revisión confirmada")
for nombre, cambio in (
    ("tarifa", {"tarifa": {"salida": "11.00"}}),
    ("max_output_tokens", {"configuracion": {"max_output_tokens": 2500}}),
    ("prompt_cache_options", {"configuracion": {"prompt_cache_options": {"mode": "explicit", "ttl": "12h"}}}),
):
    _, p = presupuesto(b, refs=[REF_MARTA])
    parametros(**cambio)
    n = envios()
    s, e = pedir(b, p, esperado=409)
    ok(e["detail"]["motivo"] == "precio" and e["detail"]["presupuesto"]["id"] != p["id"], f"cambia {nombre}: 409 con presupuesto nuevo ({e['detail']['presupuesto']['reserva_estimada']})")
    ok(envios() == n and not mejoras(b)["mejoras"], f"cambia {nombre}: ni operación, ni reserva, ni llamada")
    parametros(restaurar=True)
_, p = presupuesto(b, refs=[REF_MARTA])
v2 = req("POST", f"/api/elementos/{el['id']}/fichas")
req("PATCH", f"/api/fichas/{v2['id']}", {"rasgos_fijos": ["pelo castaño corto", "pecas", "gafas redondas de pasta", "lunar en la mejilla"], "updated_at": v2["updated_at"]})
req("POST", f"/api/fichas/{v2['id']}/aprobar")
n = envios()
s, e = pedir(b, p, esperado=409)
nuevo = e["detail"]["presupuesto"]
ok(e["detail"]["motivo"] == "precio" and nuevo["huella_entrada"] != p["huella_entrada"] and envios() == n, "cambian los rasgos de una referencia: 409, huella nueva y sin llamada")
s, v = pedir(b, nuevo)
op = v["operacion"]["id"]
ok(s == 201 and v["operacion"]["coste_estimado"] == nuevo["reserva_estimada"] and v["operacion"]["mejorar"]["presupuesto_id"] == nuevo["id"], "otro clic con el presupuesto nuevo crea la operación con esa reserva")
s, e = pedir(b, nuevo, esperado=409)
ok(e["detail"]["motivo"] == "usado", "un presupuesto ya usado no crea una segunda operación")
final(b, op)

print("\n— 14 · conflicto de revisión al pulsar")
b = borrador("c14")
_, p = presupuesto(b)
llamar("PUT", f"/api/borradores/{b['id']}", {"revision": b["revision"], "texto": "cambiado en otra ventana", "alcance": {"tipo": "nueva"}})
n = envios()
s, e = pedir(b, p, esperado=409)
ok(e["detail"]["motivo"] == "revision" and envios() == n and not mejoras(b)["mejoras"], "409, sin operación ni llamada")
ok(req("GET", f"/api/borradores/{b['id']}")["texto"] == "cambiado en otra ventana", "el texto se conserva tal cual")
b2 = req("GET", f"/api/borradores/{b['id']}")
_, p2 = presupuesto(b2)
llamar("POST", f"/api/borradores/{b['id']}/cerrar")
s, e = pedir(b2, p2, esperado=409)
ok(e["detail"]["motivo"] == "cerrado" and envios() == n, "borrador cerrado: 409 sin llamada")

print("\n— 15 · escritura en caché dentro de la reserva")
b = borrador("c15")
_, p = presupuesto(b)
ok(p["reserva_estimada"] == reserva_formula(p["bytes_entrada"], 2.5), "configuración propuesta: entrada a 2,50 $ por millón")
parametros(configuracion={"prompt_cache_options": {"mode": "explicit", "ttl": "12h"}})
_, p = presupuesto(b)
ok(p["reserva_estimada"] == reserva_formula(p["bytes_entrada"], 5.0), "con ttl 12h: entrada a 5,00 $ por millón")
parametros(restaurar=True)

print("\n— 16 · aviso según el motivo de respuesta incompleta")
avisos = {
    "incompleta": "el modelo llegó al límite de salida (2000 tokens)",
    "incompleta_filtro": "el filtro de contenido de OpenAI cortó la respuesta",
    "incompleta_mensajes": "OpenAI alcanzó su límite de mensajes",
    "incompleta_steered": "motivo no esperado (steered)",
    "incompleta_desconocida": "motivo «motivo_nuevo» de OpenAI",
}
for sim, texto in avisos.items():
    b, p, op = lanzar(f"c16-{sim}", sim)
    m = final(b, op)
    ok(texto in m["error"] and m["resultado"]["calidad"] == "incompleta", f"{sim}: «{m['error']}»")
    revisar = sim in ("incompleta_mensajes", "incompleta_steered", "incompleta_desconocida")
    ok(m["resultado"]["a_revisar"] == revisar, f"{sim}: marcado para revisar = {revisar}")

print("\n— 17 · consumo sin cuadrar")
b, p, op = lanzar("c17", "sin_cuadrar")
m = final(b, op)
it = operacion_registro(op)["coste"]["intentos_mejora"][0]
ok(it["estado_consumo"] == "sin_cuadrar" and m["coste"]["posible_cargo"] == p["reserva_estimada"], "total distinto de entrada + salida: sin cuadrar, con posible cargo")

print("\n— 18 · segundo plano: plazo, caducidad y respuesta sin consumo")
b, p, op = lanzar("c18", "normal")
final(b, op)
reg = operacion_registro(op)
ok(reg["mejorar"]["configuracion"]["background"] and reg["mejorar"]["configuracion"]["store"] and reg["intentos_detalle"][0]["id_remoto"].startswith("resp_sim_"), "background y store en la petición; id guardado en el intento")
b, p, op = lanzar("c18-sinfinal", "sin_final")
m = esperar(b, op, lambda m: m["estado"] == "incierta", "sin final", 400)
n = envios()
time.sleep(1)
ok("Sin final de OpenAI" in m["error"] and envios() == n, "a los 6 s simulados: incierta «sin final» y deja de consultar")
b, p, op = lanzar("c18-caducada", "caducada")
m = final(b, op)
ok(m["estado"] == "incierta" and "caducada o no encontrada" in m["error"] and m["coste"]["categoria"] == "reservado", "404 al consultar: incierta, nunca coste cero")
llamar("POST", f"/api/operaciones/{op}/marcar-fallida")
ok(mejora(b, op)["coste"]["posible_cargo"] == p["reserva_estimada"], "marcada fallida: posible cargo = reserva estimada")
b, p, op = lanzar("c18-falla", "fallida_sin_consumo")
m = final(b, op)
ok(m["estado"] == "fallida" and m["coste"]["posible_cargo"] == p["reserva_estimada"], "failed sin usage: consumo ausente y posible cargo")

print("\n— 19 · propuesta válida sin consumo")
b, p, op = lanzar("c19", "sin_consumo")
m = final(b, op)
ok(m["estado"] == "completada" and m["resultado"]["calidad"] == "completa" and m["resultado"]["estado_consumo"] == "ausente", "completa y sin consumo informado")
ok(m["coste"]["posible_cargo"] == p["reserva_estimada"], "posible cargo pendiente = reserva estimada")
bb = req("GET", f"/api/borradores/{b['id']}")
s, r = llamar("POST", f"/api/borradores/{b['id']}/aceptar", {"operacion_id": op, "revision": bb["revision"]})
ok(s == 200, "se puede aceptar aunque falte el consumo")
ok(mejora(b, op)["coste"]["posible_cargo"] == p["reserva_estimada"] and operacion_registro(op)["coste"]["posible_cargo"] == p["reserva_estimada"], "tras Aceptar, Mesa y Registro siguen con el posible cargo")
fila = fila_csv(operacion_registro(op))
ok(float(fila["posible_cargo_pendiente"]) == p["reserva_estimada"], "y el CSV también")
b, p, op2 = lanzar("c19-desc", "sin_consumo")
final(b, op2)
llamar("POST", f"/api/borradores/{b['id']}/descartar", {"operacion_id": op2})
ok(mejora(b, op2)["coste"]["posible_cargo"] == p["reserva_estimada"], "tras Descartar, el posible cargo sigue pendiente")
llamar("POST", f"/api/intentos/{mejora(b, op2)['coste']['cargos'][0]['intento_id']}/cargo", {"cobrado": False})
ok(mejora(b, op2)["coste"]["posible_cargo"] == 0, "solo «No hubo cargo» lo deja en cero")
b, p, op = lanzar("c19-inc", "incompleta")
ok(final(b, op)["coste"]["intentos_mejora"][0]["estado_consumo"] == "valido", "incompleta con consumo válido: sigue sin Aceptar directo (caso 4)")

print("\n— 20 · consumo ausente frente a consumo cero")
casos = {"consumo_cero": ("valido", 0), "sin_consumo": ("ausente", None), "consumo_nulo": ("ausente", None), "consumo_negativo": ("sin_cuadrar", None)}
for sim, (estado, coste) in casos.items():
    b, p, op = lanzar(f"c20-{sim}", sim)
    m = final(b, op)
    it = m["coste"]["intentos_mejora"][0]
    if estado == "valido":
        ok(it["estado_consumo"] == "valido" and it["coste_segun_tarifa"] == 0 and m["coste"]["posible_cargo"] == 0 and m["coste"]["categoria"] == "estimado", f"{sim}: válido, 0 $ según tarifa y sin posible cargo")
    else:
        ok(it["estado_consumo"] == estado and m["coste"]["posible_cargo"] == p["reserva_estimada"], f"{sim}: {estado}, posible cargo = reserva estimada")

print("\n— D4 · aviso de tarifa sin verificar")
parametros(tarifa={"verificada_en": (date.today() - timedelta(days=31)).isoformat()})
b = borrador("cd4")
_, p = presupuesto(b)
ok((p["aviso_tarifa"] or "").startswith("Tarifa sin verificar desde"), f"presupuesto con aviso: {p['aviso_tarifa']}")
parametros(restaurar=True)
_, p = presupuesto(b)
ok(p["aviso_tarifa"] is None, "con la tarifa verificada hace menos de 30 días, sin aviso")

print("\n— 21 · presupuesto del proyecto superado: confirmar, recargar y continuar")
b, p, op = lanzar("c21", "incompleta")
final(b, op)
_, pr = llamar("POST", f"/api/operaciones/{op}/mejorar/presupuesto", {})
ajustes = req("GET", "/api/ajustes")
original = ajustes.get("presupuesto_por_defecto")
total = req("GET", f"/api/espacios/{EP}/taller")["gasto"]["total"]
req("PUT", "/api/ajustes", {"presupuesto_por_defecto": round(total + 0.01, 2)})
try:
    n = envios()
    s1, e = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": pr["id"]})
    m = mejora(b, op)
    ok(s1 == 409 and "presupuesto" in e.get("detail", "") and m["estado"] == "presupuestada", f"reintento por encima del presupuesto: 409 y queda pendiente de confirmar ({m['estado']})")
    ok(m["presupuesto_id"] == pr["id"] and m["intentos"] == 1 and envios() == n, "la mejora conserva su presupuesto; ni intento ni envío nuevos")
    s2, e = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": pr["id"]})
    ok(s2 == 409 and "presupuesto" in e.get("detail", "") and mejora(b, op)["intentos"] == 1, "repetir sin confirmar vuelve a pedir confirmación, sin duplicar")
    m = mejora(b, op)
    s3, v = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": m["presupuesto_id"], "confirmado_por_encima_del_presupuesto": True})
    ok(s3 == 200, f"tras recargar, «Continuar» con el presupuesto de la mejora y confirmando: {s3} {'' if s3 == 200 else v}")
    m = final(b, op)
    ok(m["intentos"] == 2 and envios() == n + 1, f"un solo intento nuevo y un solo envío ({m['intentos']} intentos)")
    ok(len(m["coste"]["intentos_mejora"]) == 2 and m["coste"]["intentos_mejora"][1]["numero"] == 2, "el coste lista exactamente dos intentos")
    s4, _ = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": m["presupuesto_id"], "confirmado_por_encima_del_presupuesto": True})
    ok(s4 == 409 and mejora(b, op)["intentos"] == 2 and envios() == n + 1, "otro clic con el mismo presupuesto ya usado: 409, sin tercer intento")

    req("PUT", "/api/ajustes", {"presupuesto_por_defecto": original if original is not None else 1000})
    b, p, op = lanzar("c21-cambio", "incompleta")
    final(b, op)
    _, pr = llamar("POST", f"/api/operaciones/{op}/mejorar/presupuesto", {})
    total = req("GET", f"/api/espacios/{EP}/taller")["gasto"]["total"]
    req("PUT", "/api/ajustes", {"presupuesto_por_defecto": round(total + 0.01, 2)})
    s1, _ = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": pr["id"]})
    ok(s1 == 409 and mejora(b, op)["estado"] == "presupuestada", "segunda mejora pendiente de confirmar")
    parametros(tarifa={"salida": "12.00"})
    n = envios()
    s2, e = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": pr["id"], "confirmado_por_encima_del_presupuesto": True})
    ok(s2 == 409 and e["detail"]["motivo"] == "precio" and e["detail"]["presupuesto"]["tipo"] == "reintento", "si la tarifa cambió mientras esperaba: 409 con precio nuevo")
    ok(mejora(b, op)["estado"] == "presupuestada" and envios() == n and mejora(b, op)["intentos"] == 1, "sin autorizar, sin envío ni intento")
    nuevo = e["detail"]["presupuesto"]
    s3, _ = llamar("POST", f"/api/operaciones/{op}/mejorar/reintentar", {"presupuesto_id": nuevo["id"], "confirmado_por_encima_del_presupuesto": True})
    m = final(b, op)
    ok(s3 == 200 and m["intentos"] == 2 and m["presupuesto_id"] == nuevo["id"] and m["reserva_estimada"] == nuevo["reserva_estimada"] and envios() == n + 1, "con el precio nuevo y otro clic: un intento con esa reserva")
    parametros(restaurar=True)

    b = borrador("c21-inicial")
    _, p = presupuesto(b)
    total = req("GET", f"/api/espacios/{EP}/taller")["gasto"]["total"]
    req("PUT", "/api/ajustes", {"presupuesto_por_defecto": round(total + 0.01, 2)})
    n = envios()
    s1, e = pedir(b, p, esperado=None)
    vista = mejoras(b)["mejoras"][0]
    ok(s1 == 409 and vista["estado"] == "presupuestada" and vista["presupuesto_id"] == p["id"], "primera mejora por encima del presupuesto: pendiente, con su presupuesto a la vista")
    s2, _ = llamar("POST", f"/api/operaciones/{vista['id']}/mejorar/reintentar", {"presupuesto_id": vista["presupuesto_id"], "confirmado_por_encima_del_presupuesto": True})
    m = final(b, vista["id"])
    ok(s2 == 200 and m["intentos"] == 1 and envios() == n + 1, "tras recargar se continúa sin el id de petición: un solo intento")
finally:
    req("PUT", "/api/ajustes", {"presupuesto_por_defecto": original if original is not None else 1000})

print("\n— 11 · nada se repite solo")
n = envios()
time.sleep(2)
ok(envios() == n, "el contador del proveedor simulado no sube sin un clic")
print("\nTODO OK")
