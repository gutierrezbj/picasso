"""Prueba de la Fase 7 · paquete de edición (§11.3). Exporta la pieza de la
semilla, descarga el ZIP y comprueba carpetas, nombres, fotogramas exactos y la
línea de tiempo. Solo contra la base de pruebas (cerrojo en comun.py)."""
import io
import json
import os
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from xml.etree import ElementTree

import requests

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, req  # noqa: E402

PZ = os.environ["PZ"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def exportar(cuerpo):
    exp = req("POST", f"/api/piezas/{PZ}/exportar", cuerpo)
    for _ in range(240):
        e = req("GET", f"/api/exportaciones/{exp['id']}")
        if e["estado"] != "en_curso":
            return e
        time.sleep(0.5)
    ok(False, "la exportación no termina")


def frames(ruta):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
         "-show_entries", "stream=nb_read_frames,r_frame_rate,width,height", "-of", "json", str(ruta)],
        capture_output=True, check=False,
    )
    s = json.loads(r.stdout or "{}")["streams"][0]
    return int(s["nb_read_frames"]), s["r_frame_rate"], s["width"], s["height"]


m = req("GET", f"/api/piezas/{PZ}/montaje")
fps = m["proyecto"]["fps"]
ok(len(m["planos"]) >= 1, f"hay montaje que exportar ({len(m['planos'])} planos a {fps} fps)")

ok(requests.post(f"{API}/api/piezas/{PZ}/exportar", json={"rutas": "absolutas"}, timeout=30).status_code == 422,
   "con rutas absolutas hay que decir la carpeta (422)")

e = exportar({"alternativas": True})
ok(e["estado"] == "lista", f"exportación lista ({e.get('error')})")
zip_bytes = requests.get(f"{API}/api/exportaciones/{e['id']}/archivo", timeout=60).content
ok(zip_bytes[:2] == b"PK", "se descarga un ZIP")

with tempfile.TemporaryDirectory() as tmp:
    zipfile.ZipFile(io.BytesIO(zip_bytes)).extractall(tmp)
    raiz = next(Path(tmp).iterdir())
    for sub in ("video", "imagen", "audio/voces", "audio/musica", "audio/ambiente", "fichas", "alternativas"):
        ok((raiz / sub).is_dir(), f"carpeta {sub}/")
    for fijo in ("timeline.fcpxml", "previo.mp4", "guion.md", "LEEME.md", "manifiesto.json"):
        ok((raiz / fijo).is_file(), fijo)

    man = json.loads((raiz / "manifiesto.json").read_text(encoding="utf-8"))
    ok(man["fps"] == fps, "el manifiesto recoge los fps del proyecto")
    total = 0
    for p in man["planos"]:
        ok(p["archivo"] and p["archivo"].startswith("video/E"), f"{p['etiqueta']} → {p['archivo']}")
        n, ritmo, w, h = frames(raiz / p["archivo"])
        ok(n == p["frames"] and ritmo == f"{fps}/1", f"{p['archivo']}: {n} fotogramas a {ritmo} (esperados {p['frames']})")
        ok(f"{w}x{h}" == man["resolucion"], f"{p['archivo']} en {w}x{h}")
        total += p["frames"]
    ok(total == man["duracion_frames"], "la suma de los clips es la duración de la pieza")
    for v in man["voces"]:
        ok((raiz / v["archivo"]).is_file() and v["archivo"].startswith("audio/voces/E"), f"voz {v['archivo']}")
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate,channels,codec_name",
                            "-of", "csv=p=0", str(raiz / v["archivo"])], capture_output=True, check=False)
        ok(r.stdout.decode().strip() == "pcm_s16le,48000,1", f"{v['archivo']} en WAV 48 kHz mono")

    xml = ElementTree.parse(raiz / "timeline.fcpxml").getroot()
    ok(xml.tag == "fcpxml", "timeline.fcpxml es XML válido")
    seq = xml.find(".//sequence")
    ok(seq.get("duration") == f"{man['duracion_frames']}/{fps}s", f"la secuencia dura {seq.get('duration')}")
    formato = xml.find(".//format")
    ok(formato.get("frameDuration") == f"1/{fps}s", "el formato declara los fps del proyecto")
    srcs = [m.get("src") for m in xml.iter("media-rep")]
    ok(srcs and all(s.startswith("./") for s in srcs), "rutas relativas a la carpeta del paquete")
    for s in srcs:
        ok((raiz / s[2:]).is_file(), f"la línea de tiempo apunta a un archivo que existe: {s}")
    voces_lane = [c for c in xml.iter("asset-clip") if c.get("lane") == "-1"]
    ok(len(voces_lane) == len(man["voces"]), "cada voz va enganchada a su plano en la pista -1")

e2 = exportar({"rutas": "absolutas", "carpeta_destino": "/Users/prueba/Movies"})
ok(e2["estado"] == "lista", "exportación con rutas absolutas")
zip2 = requests.get(f"{API}/api/exportaciones/{e2['id']}/archivo", timeout=60).content
with zipfile.ZipFile(io.BytesIO(zip2)) as z:
    nombre = next(n for n in z.namelist() if n.endswith("timeline.fcpxml"))
    xml2 = ElementTree.fromstring(z.read(nombre))
    carpeta = nombre.split("/")[0]
srcs2 = [m.get("src") for m in xml2.iter("media-rep")]
ok(all(s.startswith(f"file:///Users/prueba/Movies/{carpeta}/") for s in srcs2),
   "con rutas absolutas apuntan a la carpeta indicada")

print("\nPaquete de edición: todo en orden.")
