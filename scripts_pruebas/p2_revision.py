import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from comun import req

PZ = os.environ["PZ"]

g = req("GET", f"/api/piezas/{PZ}/guion")
ids_aprobadas = [e["id"] for e in g["escenas_aprobadas"]]

print("editar escena aprobada sin revisión:", req("PATCH", f"/api/escenas/{ids_aprobadas[0]}", {"titulo": "x", "updated_at": g["escenas_aprobadas"][0]["updated_at"]}).get("detail"))

g = req("POST", f"/api/piezas/{PZ}/guion/revision")
print("revisión abierta:", g["hay_revision_en_curso"], "| aprobado sigue:", g["guion"]["estado"])
print("copias:", [(e["orden"], e["titulo"], e["origen_id"][:6]) for e in g["escenas"]])

# editar una, borrar otra, añadir una nueva y reordenar
e1, e2, e3 = g["escenas"]
req("PATCH", f"/api/escenas/{e1['id']}", {"que_ocurre": "Ahora ocurre otra cosa.", "updated_at": e1["updated_at"]})
req("DELETE", f"/api/escenas/{e3['id']}")
req("POST", f"/api/piezas/{PZ}/guion/escenas", {"titulo": "Escena nueva de la revisión"})
g = req("GET", f"/api/piezas/{PZ}/guion")
nueva = next(e for e in g["escenas"] if not e["origen_id"])
req("PATCH", f"/api/escenas/{nueva['id']}", {"que_ocurre": "Lo que pasa en la nueva.", "updated_at": nueva["updated_at"]})
g = req("GET", f"/api/piezas/{PZ}/guion")
req("POST", f"/api/escenas/{g['escenas'][-1]['id']}/mover", {"a": 0})

g = req("GET", f"/api/piezas/{PZ}/guion")
d = g["diferencias"]
print("guion aprobado intacto:", [(e["orden"], e["titulo"], e["que_ocurre"]) for e in g["escenas_aprobadas"]])
print("añadidas:", [x["titulo"] for x in d["anadidas"]])
print("editadas:", [(x["titulo"], [c["campo"] for c in x["campos"]]) for x in d["editadas"]])
print("eliminadas:", [x["titulo"] for x in d["eliminadas"]])
print("reordenadas:", [(x["titulo"], x["de"], x["a"]) for x in d["reordenadas"]])

print("aprobar sin marcas:", req("POST", f"/api/piezas/{PZ}/guion/revision/aprobar", {"marcas": {}}).get("detail"))
marcas = {x["escena_id"]: "afecta_planos" for x in d["editadas"]}
r = req("POST", f"/api/piezas/{PZ}/guion/revision/aprobar", {"marcas": marcas})
print("tras aprobar revisión:", {k: r["guion"].get(k) for k in ("estado", "revision", "revision_en_curso")})
print("escenas vigentes:", [(e["orden"], e["titulo"], e["borrador"]) for e in r["escenas"]])
print("ids conservados:", [e["id"][:6] in [i[:6] for i in ids_aprobadas] for e in r["escenas"]])
print("historial:", r["guion"]["historial_revisiones"])

# descartar
g = req("POST", f"/api/piezas/{PZ}/guion/revision")
e = g["escenas"][0]
req("PATCH", f"/api/escenas/{e['id']}", {"titulo": "Título que se va a descartar", "updated_at": e["updated_at"]})
g = req("POST", f"/api/piezas/{PZ}/guion/revision/descartar")
print("tras descartar:", g["hay_revision_en_curso"], [(x["orden"], x["titulo"]) for x in g["escenas"]])
