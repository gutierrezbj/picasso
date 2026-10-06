"""Proyecto de imagen de punta a punta (§6.1 brief, §6.4 encargo → lienzo).
Nació el 07-10-2026: Juan llegó operando a un lienzo vacío porque el encargo
nunca se había conectado con los planos. Solo contra la base de pruebas."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from comun import elemento_aprobado, req, subir_imagen  # noqa: E402

EP = os.environ["EP"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


p = req("POST", f"/api/espacios/{EP}/proyectos", {"nombre": "Imagen de punta a punta", "tipo": "imagen"})
ok(p.get("tipo") == "imagen" and p.get("formato_video"), "se crea con solo nombre y tipo (formato por defecto)")
P = p["id"]

d = req("PUT", f"/api/proyectos/{P}/desarrollo", {
    "notas": "Una foto mía al timón de una nave", "intencion": "Confianza y rumbo",
    "tono": "Sereno", "que_evitar": "Piel plástica", "destino": "web",
    "destino_detalle": "Portada", "estado": "listo", "respuestas_formato": {"uso": "viejo"},
})
d = req("GET", f"/api/proyectos/{P}/desarrollo")
ok(d["destino"] == "web" and d["que_evitar"] == "Piel plástica", "el brief guarda destino y qué evitar")
ok("uso" not in d["respuestas_formato"], "la pregunta antigua «uso» desaparece")

el = elemento_aprobado(EP, "personaje", "Capitán de pruebas")
rep = req("POST", f"/api/proyectos/{P}/reparto", {"elemento_id": el["id"]})
extra = subir_imagen(EP, "referencia-encargo.png")

pz = req("GET", f"/api/proyectos/{P}/piezas")[0]["id"]
req("PUT", f"/api/piezas/{pz}/guion/encargo", {
    "que_se_muestra": "El capitán al timón", "composicion": "Plano medio, luz lateral",
    "numero_imagenes": 2, "elementos": [], "referencias": [extra["id"]],
})
g = req("POST", f"/api/piezas/{pz}/guion/aprobar")
ok(g["guion"]["estado"] == "aprobado", "encargo aprobado")

lz = req("GET", f"/api/piezas/{pz}/lienzo")
ok(len(lz["imagenes"]) == 2 and lz["planos_sin_escena"] == [], "el lienzo tiene 2 imágenes, no planos sin escena")
i1 = lz["imagenes"][0]
ok(i1["modalidad"] == "imagen" and i1["que_se_muestra"] == "El capitán al timón", "I1 nace con qué se muestra")
ok(i1["direccion"].get("composicion") == "Plano medio, luz lateral", "I1 trae la composición del encargo")
ok(rep["id"] in i1["elementos"], "sin elementos elegidos, entra todo el reparto")

pr = req("GET", f"/api/planos/{i1['id']}/prompt")
ok("Composición: Plano medio" in pr["texto"], "la composición va al prompt")
ok("Elementos: Capitán de pruebas" in pr["texto"], "el elemento del reparto va al prompt")
ok(any(f["nombre"] == "Capitán de pruebas" and f["aprobada"] for f in pr["fichas_usadas"]), "usa su ficha validada")
ok("Piel plástica" in pr["texto"], "«qué evitar» del brief va a los negativos")

prep = req("POST", "/api/operaciones", {"destino_id": i1["id"], "accion": "imagen_con_referencias", "modelo": "sim-imagen"})
op = prep["operacion"]
refs = [r["medio_id"] for r in op["entradas"].get("referencias") or []]
ok(extra["id"] in refs and len(refs) >= 2, f"la operación lleva las referencias de la ficha y del encargo ({len(refs)})")
req("POST", f"/api/operaciones/{op['id']}/autorizar", {})
for _ in range(60):
    estado = next(o for o in req("GET", f"/api/operaciones?destino_id={i1['id']}") if o["id"] == op["id"])["estado"]
    if estado == "completada":
        break
    time.sleep(0.5)
ok(estado == "completada", "la imagen se produce (simulado)")

req("POST", f"/api/piezas/{pz}/guion/revision")
req("PUT", f"/api/piezas/{pz}/guion/encargo", {"numero_imagenes": 1, "que_se_muestra": "El capitán, de perfil"})
req("POST", f"/api/piezas/{pz}/guion/revision/aprobar", {"marcas": {"encargo": "afecta_planos"}})
lz = req("GET", f"/api/piezas/{pz}/lienzo")
ok(len(lz["imagenes"]) == 1 and lz["imagenes"][0]["id"] == i1["id"], "bajar a 1 imagen quita la que no tiene tomas y conserva I1")
ok(lz["imagenes"][0]["que_se_muestra"] == "El capitán al timón", "I1 tiene tomas: no se pisa su texto")

req("POST", f"/api/piezas/{pz}/guion/revision")
req("PUT", f"/api/piezas/{pz}/guion/encargo", {"numero_imagenes": 3})
req("POST", f"/api/piezas/{pz}/guion/revision/aprobar", {"marcas": {"encargo": "afecta_planos"}})
lz = req("GET", f"/api/piezas/{pz}/lienzo")
ok(len(lz["imagenes"]) == 3, "subir a 3 imágenes crea las que faltan")
ok(lz["imagenes"][2]["que_se_muestra"] == "El capitán, de perfil", "las nuevas nacen con el encargo vigente")

print("\nImagen de punta a punta: todo en orden.")
