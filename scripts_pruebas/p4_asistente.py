import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cli import req  # noqa: E402

CORTO = os.environ["CORTO"]
PZ = os.environ["PZ"]

p = req("POST", f"/api/proyectos/{CORTO}/asistente/proponer_escenas", {"pieza_id": PZ})
print("proponer_escenas:", [(x["tipo"], x["nombre"]) for x in p["partes"]])
r = req("POST", f"/api/propuestas/{p['id']}/parte/{p['partes'][0]['id']}", {"accion": "aceptar", "texto": "Escena del asistente"})
print("aceptar escena:", r)
g = req("GET", f"/api/piezas/{PZ}/guion")
print("hay revisión tras aceptar:", g["hay_revision_en_curso"], [(e["orden"], e["titulo"]) for e in g["escenas"]])

esc = g["escenas"][0]
p2 = req("POST", f"/api/proyectos/{CORTO}/asistente/reescribir_escena", {"pieza_id": PZ, "escena_id": esc["id"], "campo": "que_se_ve"})
print("reescribir_escena:", [(x["tipo"], x["destino_campo"], x["escena_id"] == esc["id"]) for x in p2["partes"]])
r2 = req("POST", f"/api/propuestas/{p2['id']}/parte/{p2['partes'][0]['id']}", {"accion": "aceptar", "texto": "Se ve el muelle entre la niebla."})
print("aceptar reescritura:", r2)
g = req("GET", f"/api/piezas/{PZ}/guion")
print("que_se_ve ahora:", [e["que_se_ve"] for e in g["escenas"]][0])
print("descartar revisión:", req("POST", f"/api/piezas/{PZ}/guion/revision/descartar")["hay_revision_en_curso"])
