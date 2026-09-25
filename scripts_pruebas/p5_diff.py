import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from comun import req

PZ = os.environ["PZ"]

# Simula lo que hace el autoguardado del frontend: manda "" donde había null.
g = req("POST", f"/api/piezas/{PZ}/guion/revision")
for e in g["escenas"]:
    req(
        "PATCH",
        f"/api/escenas/{e['id']}",
        {"sonido_previsto": "", "intencion": "", "updated_at": e["updated_at"]},
    )
g = req("GET", f"/api/piezas/{PZ}/guion")
d = g["diferencias"]
print("editadas sin cambiar nada de verdad (debe ser 0):", len(d["editadas"]))
print("hay_cambios:", d["hay_cambios"])

# Ahora un cambio de verdad
e = g["escenas"][0]
req("PATCH", f"/api/escenas/{e['id']}", {"que_ocurre": "Cambio real.", "updated_at": e["updated_at"]})
d = req("GET", f"/api/piezas/{PZ}/guion")["diferencias"]
print("editadas con un cambio real (debe ser 1):", [(x["titulo"], [c["campo"] for c in x["campos"]]) for x in d["editadas"]])
print("descartar:", req("POST", f"/api/piezas/{PZ}/guion/revision/descartar")["hay_revision_en_curso"])
