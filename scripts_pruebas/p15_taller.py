"""Prueba del Taller (§6.5, 18.29): carpetas, referencias, ingredientes y generar.
Solo contra la base de pruebas (cerrojo en comun.py). Solo el modelo simulado."""
import os
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, elemento_aprobado, req  # noqa: E402

EP = os.environ["EP"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def estado_http(metodo, ruta, cuerpo):
    return requests.request(metodo, f"{API}{ruta}", json=cuerpo, timeout=60).status_code


t = req("GET", f"/api/espacios/{EP}/taller")
ok(any(c["nombre"] == "General" for c in t["carpetas"]), "el Taller crea la carpeta «General»")
ok(any(m["id"] == "sim-imagen" and m["elegible"] for m in t["modelos"]), "ofrece los modelos de imagen")
ok(all("generar_voz" not in m["acciones"] for m in t["modelos"]), "solo ofrece modelos de imagen")

carpeta = req("POST", f"/api/espacios/{EP}/carpetas", {"nombre": "Día 3"})
ok(carpeta["nombre"] == "Día 3", "se crea una carpeta")
ok(estado_http("POST", f"/api/espacios/{EP}/carpetas", {"nombre": "  "}) == 400, "una carpeta necesita nombre")

el = elemento_aprobado(EP, "personaje", "Capitana Taller")
req("PATCH", f"/api/elementos/{el['id']}", {"persona_real": True, "updated_at": req("GET", f"/api/elementos/{el['id']}")["updated_at"]})
t = req("GET", f"/api/espacios/{EP}/taller")
ref = next(r for r in t["referencias"] if r["nombre"] == "Capitana Taller")
ok(ref["clase"] == "personaje" and ref["persona_real"], "las fotos de las fichas validadas son referencias, con su uso")

ing = req("POST", f"/api/espacios/{EP}/taller/ingredientes", {"texto": "una mujer", "referencias": [{"medio_id": ref["medio_id"]}]})["ingredientes"]
ok(ing[0]["nivel"] == "rojo", "una foto diminuta sale en rojo")
ok(ing[-1]["nivel"] == "rojo", "un prompt de dos palabras sale en rojo")
bueno = "La capitana al timón de su nave, en el puente, plano medio a la altura de los ojos, luz cálida del amanecer por el ventanal, foto realista"
ok(req("POST", f"/api/espacios/{EP}/taller/ingredientes", {"texto": bueno, "referencias": []})["ingredientes"][-1]["nivel"] == "verde",
   "un prompt con sus partes sale en verde")

ok(estado_http("POST", f"/api/espacios/{EP}/taller/generar", {
    "carpeta_id": carpeta["id"], "modelo": "sim-imagen", "texto": "", "referencias": [],
}) == 400, "no se genera sin texto")
ok(estado_http("POST", f"/api/espacios/{EP}/taller/generar", {
    "carpeta_id": carpeta["id"], "modelo": "sim-imagen", "texto": bueno, "referencias": [{"medio_id": "no-existe"}],
}) == 409, "una referencia de otro espacio no vale")

g = req("POST", f"/api/espacios/{EP}/taller/generar", {
    "carpeta_id": carpeta["id"], "modelo": "sim-imagen", "texto": bueno,
    "referencias": [{"medio_id": ref["medio_id"]}], "relacion": "9:16", "cuantas": 2,
})
op = g["operacion"]
ok(op["estado"] == "autorizada" and op["accion"] == "imagen_con_referencias", "Generar autoriza con el precio delante")
ok(abs(float(op["coste_estimado"]) - 0.08) < 0.001, "el precio son dos imágenes")
ok("Capitana Taller es una persona real" in op["prompt_visible"] and "Imagen 1 (frontal)" in op["prompt_visible"],
   "el prompt enviado lleva identidad y referencias")

for _ in range(120):
    v = req("GET", f"/api/carpetas/{carpeta['id']}/tomas")
    if len(v["tomas"]) >= 2:
        break
    time.sleep(0.5)
ok(len(v["tomas"]) == 2, "salen dos tomas en la carpeta")
toma = v["tomas"][0]
ok(toma["texto"] == bueno and toma["referencias"] == [ref["medio_id"]], "cada toma recuerda el texto y las referencias")
ok(toma["coste"] is not None and toma["modelo"] == "sim-imagen", "cada toma enseña modelo y coste")
r = req("PATCH", f"/api/tomas/{toma['id']}", {"valoracion": "buena", "nota": "me gusta"})
ok(r["valoracion"] == "buena" and r["nota"] == "me gusta", "se elige y se anota una toma del Taller")
ok(req("GET", f"/api/espacios/{EP}/taller")["gasto"]["total"] > 0, "el Taller lleva su propio gasto")
