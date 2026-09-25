import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cli import req  # noqa: E402

EP = os.environ["EP"]

# --- Tipo imagen: encargo de imagen ---
img = req("POST", f"/api/espacios/{EP}/proyectos", {"nombre": "Imagen de pruebas", "tipo": "imagen", "formato_video": "1:1"})
IMG = img["id"]
req("PUT", f"/api/proyectos/{IMG}/desarrollo", {"intencion": "Una foto de producto para la tienda", "estado": "listo", "respuestas_formato": {}})
el = req("POST", f"/api/espacios/{EP}/elementos", {"clase": "producto", "nombre": "Termo de pruebas"})
med = req("GET", f"/api/espacios/{EP}/medios")
ref = [{"medio_id": med[0]["id"], "rol": "frontal"}] if med else []
f = el["fichas"][0]
req("PATCH", f"/api/fichas/{f['id']}", {"descripcion": "Termo azul", "referencias": ref, "updated_at": f["updated_at"]})
print("aprobar ficha producto:", req("POST", f"/api/fichas/{f['id']}/aprobar").get("estado") or req("POST", f"/api/fichas/{f['id']}/aprobar"))
rep = req("POST", f"/api/proyectos/{IMG}/reparto", {"elemento_id": el["id"]})

pz = req("GET", f"/api/proyectos/{IMG}/piezas")[0]
g = req("GET", f"/api/piezas/{pz['id']}/guion")
print("clase del guion de imagen:", g["guion"]["clase"], "| falta:", g["falta_para_aprobar"])
print("crear escena en un encargo:", req("POST", f"/api/piezas/{pz['id']}/guion/escenas", {}).get("detail"))
g = req("PUT", f"/api/piezas/{pz['id']}/guion/encargo", {"que_se_muestra": "El termo sobre mármol", "composicion": "Plano cenital", "numero_imagenes": 3, "elementos": [rep["id"]]})
print("encargo:", g["encargo"], "| falta:", g["falta_para_aprobar"])
g = req("POST", f"/api/piezas/{pz['id']}/guion/aprobar")
print("encargo aprobado:", g["guion"]["estado"], g["guion"]["revision"])
print("pasos imagen:", [(p["clave"], p["estado"]) for p in req("GET", f"/api/proyectos/{IMG}")["recorrido"]["pasos"]])
g = req("POST", f"/api/piezas/{pz['id']}/guion/revision")
g = req("PUT", f"/api/piezas/{pz['id']}/guion/encargo", {"numero_imagenes": 5})
print("revisión del encargo:", g["diferencias"]["encargo"])
print("aprobar sin marca:", req("POST", f"/api/piezas/{pz['id']}/guion/revision/aprobar", {"marcas": {}}).get("detail"))
g = req("POST", f"/api/piezas/{pz['id']}/guion/revision/aprobar", {"marcas": {"encargo": "afecta_planos"}})
print("encargo revisión 2:", g["guion"]["revision"], g["encargo"]["numero_imagenes"])

# --- Tipo serie: capítulos ---
ser = req("POST", f"/api/espacios/{EP}/proyectos", {"nombre": "Serie de pruebas", "tipo": "serie", "formato_video": "16:9"})
SER = ser["id"]
print("piezas de una serie nueva:", req("GET", f"/api/proyectos/{SER}/piezas"))
c1 = req("POST", f"/api/proyectos/{SER}/piezas", {"titulo": "Capítulo uno", "de_que_va": "Empieza todo"})
c2 = req("POST", f"/api/proyectos/{SER}/piezas", {"titulo": "Capítulo dos"})
print("capítulos:", [(c["numero"], c["titulo"], c["guion_estado"]) for c in req("GET", f"/api/proyectos/{SER}/piezas")])
e = req("POST", f"/api/piezas/{c1['id']}/guion/escenas", {"titulo": "Arranque"})["escenas"][0]
req("PATCH", f"/api/escenas/{e['id']}", {"que_ocurre": "Pasa algo.", "updated_at": e["updated_at"]})
req("POST", f"/api/piezas/{c1['id']}/guion/aprobar")
print("paso capítulos con 1 de 2 aprobados:", [(p["clave"], p["estado"]) for p in req("GET", f"/api/proyectos/{SER}")["recorrido"]["pasos"]])
print("borrar capítulo 2:", req("DELETE", f"/api/piezas/{c2['id']}"))
print("borrar pieza de un corto:", req("DELETE", f"/api/piezas/{pz['id']}").get("detail"))
