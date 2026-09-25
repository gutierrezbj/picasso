"""Fase 5 · Lienzo (§7, §7.7, §8). Solo contra la base de pruebas (cerrojo en comun.py)."""
import os
import sys

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
        req(
            "PATCH",
            f"/api/escenas/{e['id']}",
            {"titulo": e["titulo"] or "Escena", "que_ocurre": "Pasa algo.", "updated_at": e["updated_at"]},
        )
    g = req("POST", f"/api/piezas/{PZ}/guion/aprobar")
ok(g["guion"]["estado"] == "aprobado", "guion aprobado: el lienzo se abre")

lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
ok(len(lienzo["escenas"]) >= 3, f"{len(lienzo['escenas'])} escenas en el lienzo")
ok(len(lienzo["reparto"]) >= 1, f"{len(lienzo['reparto'])} elementos en la columna de reparto")
escena = lienzo["escenas"][0]["escena"]

p = req("POST", f"/api/escenas/{escena['id']}/planos", {})
ok(p["orden"] == 0 and p["modalidad"] == "video", "plano creado en vídeo (corto)")
ok(p["elementos"] == escena["elementos"], "hereda los elementos de la escena")

p = req(
    "PATCH",
    f"/api/planos/{p['id']}",
    {
        "que_se_muestra": "Marta entra en la biblioteca.",
        "duracion_s": 4,
        "direccion": {
            **p["direccion"],
            "encuadre_inicio": "Plano general",
            "angulo_inicio": "A la altura de los ojos",
            "encuadre_final": "Primer plano",
            "angulo_final": "Contrapicado",
            "movimiento_camara": "Travelling adelante",
            "negativos": "sin coches",
        },
        "updated_at": p["updated_at"],
    },
)
ok("de Plano general" in p["resumen_direccion"] and "a Primer plano" in p["resumen_direccion"],
   f"resumen de dirección de vídeo: {p['resumen_direccion']}")

viejo = p["updated_at"]
p = req("PATCH", f"/api/planos/{p['id']}", {"modalidad": "imagen", "updated_at": p["updated_at"]})
ok(p["direccion"]["encuadre"] == "Plano general", "a imagen: el encuadre toma el de inicio")
ok(p["direccion"]["encuadre_final"] == "Primer plano", "el final se guarda, no se pierde")
conf = req("PATCH", f"/api/planos/{p['id']}", {"que_se_muestra": "x", "updated_at": viejo})
ok(conf.get("__status") == 409 or "modificado" in str(conf.get("detail", "")), "sello viejo: 409")

p = req("PATCH", f"/api/planos/{p['id']}", {"modalidad": "video", "updated_at": p["updated_at"]})
ok(p["direccion"]["encuadre_final"] == "Primer plano", "de vuelta a vídeo: el final reaparece")

nuevo = req("POST", f"/api/planos/{p['id']}/dividir")
ok(nuevo["orden"] == 1 and nuevo["plano_anterior_encadenado"], "dividir: nuevo detrás y encadenado")
ok(nuevo["direccion"]["encuadre_inicio"] == "Primer plano", "el inicio del nuevo es el final del original")
ok(nuevo["direccion"]["encuadre_final"] is None, "el final del nuevo queda por definir")
ok(nuevo["duracion_s"] == 2, "duración partida a la mitad")
ok(nuevo["que_se_muestra"] == "", "«qué se muestra» vacío")

copia = req("POST", f"/api/planos/{nuevo['id']}/duplicar")
ok(copia["orden"] == 2, "duplicar: copia detrás")
mov = req("POST", f"/api/planos/{copia['id']}/mover", {"direccion": "antes"})
ok(mov["orden"][1] == copia["id"], "mover antes reordena")

c = req("POST", f"/api/planos/{p['id']}/correcciones", {"texto": "que no gire la cabeza"})
ok(c["correcciones_pendientes"] == 1, "corrección pendiente visible en la tarjeta")
cid = c["correcciones"][0]["id"]
c = req("PATCH", f"/api/planos/{p['id']}/correcciones/{cid}", {"estado": "hecha"})
ok(len(c["correcciones"]) == 1 and c["correcciones_pendientes"] == 0, "«Hecha» no desaparece: historial")
neg = req("DELETE", f"/api/planos/{p['id']}/correcciones/{cid}")
ok("historial" in str(neg.get("detail", "")), "las hechas no se borran")
c2 = req("POST", f"/api/planos/{p['id']}/correcciones", {"texto": "más luz en la cara"})
cid2 = [x for x in c2["correcciones"] if x["estado"] == "pendiente"][0]["id"]
c2 = req("DELETE", f"/api/planos/{p['id']}/correcciones/{cid2}")
ok(c2["correcciones_pendientes"] == 0, "las pendientes sí se borran")

pr = req("GET", f"/api/planos/{p['id']}/prompt")
ok("Marta entra en la biblioteca." in pr["texto"], "el prompt incluye «qué se muestra»")
ok("Sin: sin coches" in pr["texto"], "el prompt incluye los negativos")
ok("Sin texto ni rótulos" in pr["texto"], "el prompt nunca pide texto ni rótulos")
ok(isinstance(pr["fichas_usadas"], list), "se ve qué versión de ficha se ha usado")
pr = req("PUT", f"/api/planos/{p['id']}/prompt", {"texto": "a mano"})
ok(pr["editado_a_mano"] and pr["texto"] == "a mano", "prompt editado a mano")
pr = req("POST", f"/api/planos/{p['id']}/prompt/reconstruir")
ok(not pr["editado_a_mano"] and "Marta" in pr["texto"], "reconstruir desde la dirección")

lay = req(
    "PUT",
    f"/api/proyectos/{CORTO}/lienzo",
    {
        "posiciones": {f"pl:{p['id']}": {"x": 120, "y": 40}},
        "grupos_plegados": [escena["id"]],
        "viewport": {"x": -10, "y": 5, "zoom": 0.8},
        "seleccion": [f"pl:{p['id']}"],
        "pieza_activa": PZ,
        "mostrar_conexiones_reparto": False,
    },
)
ok(lay["grupos_plegados"] == [escena["id"]], "layout guardado (posiciones, grupos, encuadre, selección)")
lay = req("GET", f"/api/proyectos/{CORTO}/lienzo")
ok(lay["viewport"]["zoom"] == 0.8 and lay["seleccion"] == [f"pl:{p['id']}"], "layout restaurado")

lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
primera = lienzo["escenas"][0]
ok(len(primera["planos"]) == 3, f"{len(primera['planos'])} planos en la escena 1")
ok([x["orden"] for x in primera["planos"]] == [0, 1, 2], "órdenes consecutivos")
req("DELETE", f"/api/planos/{copia['id']}")
lienzo = req("GET", f"/api/piezas/{PZ}/lienzo")
ok(len(lienzo["escenas"][0]["planos"]) == 2, "borrar plano y renumerar")

print("\nTodo correcto.")
