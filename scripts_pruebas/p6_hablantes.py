"""Prueba del §6.3: quien habla es el narrador o un personaje que esté en los
elementos de esa escena. Solo en «Pruebas del constructor»."""
import os
import sys

import requests

API = os.environ["API"].rstrip("/") + "/api"
PIEZA = "a828efd5e9d94a448e96513b9ff11041"  # Corto de pruebas
PROYECTO = "5f3d0d6ff0e94725aec5b390b4f172ac"


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


g = requests.get(f"{API}/piezas/{PIEZA}/guion").json()
ok(g["guion"]["estado"] == "aprobado", f"guion aprobado, revision {g['guion']['revision']}")
revision_inicial = g["guion"]["revision"]
escenas_aprobadas = len(g["escenas_aprobadas"])

g = requests.post(f"{API}/piezas/{PIEZA}/guion/revision").json()
ok(g["hay_revision_en_curso"], "revisión en curso creada")

reparto = requests.get(f"{API}/proyectos/{PROYECTO}/reparto").json()
pers = next(r for r in reparto if r["elemento"]["clase"] == "personaje")
esc = g["escenas"][0]

r = requests.patch(
    f"{API}/escenas/{esc['id']}",
    json={
        "titulo": esc["titulo"] or "Escena de prueba",
        "que_ocurre": esc["que_ocurre"] or "Pasa algo.",
        "elementos": [pers["id"]],
        "dialogos": [{"hablante": pers["elemento_id"], "texto": "Hola."}],
        "updated_at": esc["updated_at"],
    },
)
ok(r.status_code == 200, "diálogo con un personaje de la escena: aceptado")
esc = r.json()

g = requests.get(f"{API}/piezas/{PIEZA}/guion").json()
ok(not g["falta_para_aprobar"], "nada falta para aprobar")

otro = next((r for r in reparto if r["elemento"]["clase"] != "personaje"), None)
if otro:
    r = requests.patch(
        f"{API}/escenas/{esc['id']}",
        json={
            "elementos": [pers["id"], otro["id"]],
            "dialogos": [{"hablante": otro["elemento_id"], "texto": "No debería."}],
            "updated_at": esc["updated_at"],
        },
    )
    ok(r.status_code == 409, "un elemento que no es personaje no puede hablar (409)")

r = requests.patch(
    f"{API}/escenas/{esc['id']}", json={"elementos": [], "updated_at": esc["updated_at"]}
)
ok(r.status_code == 200, "se quita el personaje de los elementos de la escena")
esc = r.json()
ok(esc["dialogos"][0]["texto"] == "Hola.", "el texto del diálogo se conserva")

g = requests.get(f"{API}/piezas/{PIEZA}/guion").json()
falta = g["falta_para_aprobar"]
ok(any("diálogo 1" in f for f in falta), f"aprobar bloqueado y explicado: {falta}")

r = requests.post(f"{API}/piezas/{PIEZA}/guion/revision/aprobar", json={"marcas": {}})
ok(r.status_code == 400 and "diálogo" in r.json()["detail"], "aprobar revisión devuelve 400")

g = requests.post(f"{API}/piezas/{PIEZA}/guion/revision/descartar").json()
ok(not g["hay_revision_en_curso"], "revisión descartada")
ok(
    g["guion"]["revision"] == revision_inicial and len(g["escenas_aprobadas"]) == escenas_aprobadas,
    "el guion aprobado queda intacto",
)
print("\nTodo correcto.")
