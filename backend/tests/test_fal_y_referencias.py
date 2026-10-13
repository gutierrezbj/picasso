import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image

from app.dominio import prompt as constructor
from app.dominio.modelos import Accion, EntradaOperacion, ReferenciaEntrada, VarianteEncuadre
from app.motor.proveedores.fal import ProveedorFal


def _plano():
    return {"modalidad": "imagen", "que_se_muestra": "Juan al timón", "direccion": {}}


def test_referencias_numeradas_y_persona_real():
    refs = [
        {"medio_id": "a", "rol": "frontal", "nombre": "Juan", "clase": "personaje", "persona_real": True},
        {"medio_id": "b", "rol": "otra", "nombre": None, "clase": None, "persona_real": False},
    ]
    texto = constructor.construir(_plano(), [], None, refs)
    assert "Imagen 1 (frontal): referencia de identidad de Juan" in texto
    assert "Imagen 2: referencia de estilo y ambiente" in texto
    assert "Juan es una persona real" in texto and "la imagen 1" in texto


def test_sin_referencias_no_hay_lineas():
    texto = constructor.construir(_plano(), [], None, [])
    assert "Imagen 1" not in texto and "persona real" not in texto


def test_fal_elige_edicion_con_referencias(tmp_path):
    ruta = tmp_path / "ref.png"
    Image.new("RGB", (3000, 2000), "white").save(ruta)
    op = EntradaOperacion(
        accion=Accion.imagen_con_referencias,
        modelo="fal-nano-banana-pro",
        prompt="Juan al timón",
        referencias=(ReferenciaEntrada(medio_id="a", ruta=str(ruta), rol="frontal"),),
        relacion_aspecto="16:9",
    )
    [(destino, cuerpo)] = ProveedorFal()._encargos(op)
    assert destino == "fal-ai/nano-banana-pro/edit"
    assert cuerpo["aspect_ratio"] == "16:9" and cuerpo["resolution"] == "2K"
    assert cuerpo["image_urls"][0].startswith("data:image/jpeg;base64,")


def test_fal_una_peticion_por_variante():
    op = EntradaOperacion(
        accion=Accion.generar_imagen,
        modelo="fal-nano-banana-pro",
        prompt="Juan al timón\nEncuadre: Plano medio.",
        n_variantes=2,
        variantes=(VarianteEncuadre(encuadre="Primer plano"), VarianteEncuadre(encuadre="Plano general")),
    )
    encargos = ProveedorFal()._encargos(op)
    assert [d for d, _ in encargos] == ["fal-ai/nano-banana-pro"] * 2
    assert "Encuadre: Primer plano." in encargos[0][1]["prompt"]
    assert "Plano medio" not in encargos[0][1]["prompt"]
