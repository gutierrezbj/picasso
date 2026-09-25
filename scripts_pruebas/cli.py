import json
import os
import subprocess

API = os.environ["API"]


def req(metodo, ruta, cuerpo=None):
    cmd = ["curl", "-s", "-X", metodo, API + ruta]
    if cuerpo is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(cuerpo)]
    salida = subprocess.run(cmd, capture_output=True, text=True).stdout
    try:
        return json.loads(salida)
    except Exception:
        return {"__raw": salida[:300]}
