"""Prueba de la Fase 7 · pistas de música y ambiente (§3.1 «PistaAudio», §11.2).
Solo contra la base de pruebas (cerrojo en comun.py)."""
import io
import math
import os
import struct
import sys
import wave

import requests

sys.path.insert(0, os.path.dirname(__file__))
from comun import API, PNG_1PX, req  # noqa: E402

PZ = os.environ["PZ"]
CORTO = os.environ["CORTO"]


def ok(c, m):
    print(("OK   " if c else "FALLA") + " · " + m)
    if not c:
        sys.exit(1)


def estado_http(metodo, ruta, cuerpo=None):
    return requests.request(metodo, f"{API}{ruta}", json=cuerpo, timeout=60).status_code


def wav(segundos=4.0, hz=48000):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(hz)
        muestras = int(segundos * hz)
        w.writeframes(b"".join(
            struct.pack("<h", int(8000 * math.sin(2 * math.pi * 220 * i / hz))) for i in range(muestras)
        ))
    return buf.getvalue()


def subir(espacio_id, nombre, datos, mime):
    r = requests.post(
        f"{API}/api/espacios/{espacio_id}/medios",
        files={"archivo": (nombre, datos, mime)},
        timeout=60,
    )
    ok(r.status_code in (200, 201), f"subida de {nombre}")
    return r.json()


esp_id = req("GET", f"/api/proyectos/{CORTO}")["proyecto"]["espacio_id"]
musica = subir(esp_id, "tema.wav", wav(4.0), "audio/wav")
ok(musica["clase"] == "audio", "el WAV entra como audio")
ok(musica.get("duracion_s") and abs(musica["duracion_s"] - 4.0) < 0.05,
   f"al importar se guarda su duración real ({musica.get('duracion_s')} s)")
imagen = subir(esp_id, "foto.png", PNG_1PX, "image/png")

ok(req("GET", f"/api/piezas/{PZ}/pistas") == [], "la pieza empieza sin pistas")
ok(estado_http("POST", f"/api/piezas/{PZ}/pistas", {"capa": "musica", "medio_id": imagen["id"]}) == 409,
   "una imagen no puede ser una pista de audio (409)")
ok(estado_http("POST", f"/api/piezas/{PZ}/pistas", {"capa": "voces", "medio_id": musica["id"]}) == 422,
   "solo hay capas de música y ambiente (422)")

pista = req("POST", f"/api/piezas/{PZ}/pistas", {"capa": "musica", "medio_id": musica["id"]})
ok(pista["capa"] == "musica" and pista["inicio_s"] == 0 and pista["volumen_db"] == 0,
   "pista de música: inicio 0 y volumen 0 dB por defecto")
ok(pista["nombre"] == "tema.wav" and abs(pista["duracion_s"] - 4.0) < 0.05, "la pista sabe su nombre y su duración")

amb = req("POST", f"/api/piezas/{PZ}/pistas",
          {"capa": "ambiente", "medio_id": musica["id"], "inicio_s": 1.5, "volumen_db": -12})
ok(amb["capa"] == "ambiente" and amb["inicio_s"] == 1.5 and amb["volumen_db"] == -12,
   "el mismo audio puede ir también como ambiente, con su inicio y volumen")

editada = req("PATCH", f"/api/pistas/{pista['id']}", {"inicio_s": 2, "volumen_db": -6, "nombre": "Tema principal"})
ok(editada["inicio_s"] == 2 and editada["volumen_db"] == -6 and editada["nombre"] == "Tema principal",
   "se cambian inicio, volumen y nombre")
ok(estado_http("PATCH", f"/api/pistas/{pista['id']}", {"inicio_s": -1}) == 422, "el inicio no puede ser negativo")
ok(estado_http("PATCH", f"/api/pistas/{pista['id']}", {"volumen_db": 20}) == 422, "volumen entre -60 y +12 dB")

pistas = req("GET", f"/api/piezas/{PZ}/pistas")
ok([p["capa"] for p in pistas] == ["ambiente", "musica"], "las pistas se listan por inicio")

ok(estado_http("DELETE", f"/api/medios/{musica['id']}") == 409,
   "no se puede borrar de la biblioteca un audio que usa una pista (409)")
req("DELETE", f"/api/pistas/{amb['id']}")
req("DELETE", f"/api/pistas/{pista['id']}")
ok(req("GET", f"/api/piezas/{PZ}/pistas") == [], "quitar las pistas no borra el audio")
ok(estado_http("DELETE", f"/api/medios/{musica['id']}") == 200, "sin pistas, el audio ya se puede borrar")

print("\nPistas de música y ambiente: todo en orden.")
