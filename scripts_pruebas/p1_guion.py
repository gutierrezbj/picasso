import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from comun import req

PZ = os.environ["PZ"]
CORTO = os.environ["CORTO"]

g = req("GET", f"/api/piezas/{PZ}/guion")
rep = req("GET", f"/api/proyectos/{CORTO}/reparto")
print("reparto:", [(r["id"][:6], r["elemento"]["nombre"], r["elemento"]["clase"]) for r in rep])

for i, e in enumerate(g["escenas"]):
    body = {
        "que_ocurre": f"Ocurre lo de la escena {i + 1}.",
        "que_se_ve": "Plano general.",
        "updated_at": e["updated_at"],
    }
    if rep:
        body["elementos"] = [rep[0]["id"]]
        body["dialogos"] = [{"hablante": rep[0]["elemento_id"], "texto": "Hola."}]
    r = req("PATCH", f"/api/escenas/{e['id']}", body)
    print("patch", i + 1, "->", "ok" if "detail" not in r else r)

g = req("GET", f"/api/piezas/{PZ}/guion")
malo = req(
    "PATCH",
    f"/api/escenas/{g['escenas'][0]['id']}",
    {"elementos": ["inventado"], "updated_at": g["escenas"][0]["updated_at"]},
)
print("elemento fuera del reparto:", malo.get("detail"))

req("POST", f"/api/escenas/{g['escenas'][2]['id']}/mover", {"direccion": "subir"})
g = req("GET", f"/api/piezas/{PZ}/guion")
print("orden tras subir la 3:", [(e["orden"], e["titulo"]) for e in g["escenas"]])
print("falta:", g["falta_para_aprobar"])

ap = req("POST", f"/api/piezas/{PZ}/guion/aprobar")
print("aprobado:", {k: ap["guion"].get(k) for k in ("estado", "revision", "revision_en_curso")})
print("aprobadas:", [(e["orden"], e["titulo"], e["borrador"]) for e in ap["escenas_aprobadas"]])
pr = req("GET", f"/api/proyectos/{CORTO}")
print("pasos:", [(p["clave"], p["estado"]) for p in pr["recorrido"]["pasos"]])
