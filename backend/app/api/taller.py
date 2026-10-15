"""El Taller (§6.5, 18.29): generar en una pantalla, con carpetas.

Las operaciones van al motor de siempre: destino {tipo: "taller", id: carpeta}
y proyecto_id `taller:{espacio}`, para que el gasto lleve su propia cuenta."""
from __future__ import annotations

import json
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException

from app.almacen import almacen
from app.asistente import openai_texto
from app.db import db, sin_id
from app.dominio import prompt as constructor_prompt
from app.dominio.modelos import (
    Accion,
    Carpeta,
    CarpetaCrear,
    EntradaOperacion,
    PeticionTaller,
    ReferenciaEntrada,
    ahora,
)
from app.motor import catalogo as cat
from app.motor import ficheros
from app.motor import operaciones as ops

router = APIRouter(prefix="/api", tags=["taller"])

NEGATIVOS_FOTO = "piel plástica o sobrepulida, aspecto de IA, brillo de estudio artificial"
ACCIONES_IMAGEN = (Accion.generar_imagen.value, Accion.imagen_con_referencias.value)
EN_MARCHA = ("autorizada", "enviada", "en_curso")


def proyecto_del_taller(espacio_id: str) -> str:
    return f"taller:{espacio_id}"


async def _espacio(espacio_id: str) -> dict[str, Any]:
    esp = await db.espacios.find_one({"_id": espacio_id})
    if not esp:
        raise HTTPException(404, "Espacio no encontrado")
    return sin_id(esp)


async def _carpetas(espacio_id: str) -> list[dict[str, Any]]:
    docs = await db.carpetas.find({"espacio_id": espacio_id}).sort("orden", 1).to_list(500)
    if not docs:
        c = Carpeta(espacio_id=espacio_id, nombre="General").model_dump(mode="json")
        c["_id"] = c["id"]
        await db.carpetas.insert_one(c)
        docs = [c]
    return [sin_id(d) for d in docs]


async def _referencias_disponibles(espacio_id: str) -> list[dict[str, Any]]:
    """Fotos de las fichas validadas del espacio (con su uso) y la biblioteca."""
    salida: list[dict[str, Any]] = []
    vistos: set[str] = set()
    for el in await db.elementos.find({"espacio_id": espacio_id}).sort("nombre", 1).to_list(2000):
        ficha = await db.fichas.find_one(
            {"elemento_id": el["_id"], "estado": "aprobada"}, sort=[("version", -1)]
        )
        for r in (ficha or {}).get("referencias") or []:
            if r["medio_id"] in vistos:
                continue
            vistos.add(r["medio_id"])
            salida.append(
                {
                    "medio_id": r["medio_id"],
                    "nombre": el["nombre"],
                    "clase": el["clase"],
                    "rol": r.get("rol") or "otra",
                    "persona_real": bool(el.get("persona_real")),
                    "rasgos_fijos": (ficha or {}).get("rasgos_fijos") or [],
                    "version": (ficha or {}).get("version"),
                }
            )
    for m in await db.medios.find(
        {"espacio_id": espacio_id, "clase": "imagen", "origen": "importado"}
    ).sort("created_at", -1).to_list(200):
        if m["_id"] in vistos:
            continue
        salida.append(
            {
                "medio_id": m["_id"],
                "nombre": m.get("etiqueta") or m.get("nombre_original") or "imagen",
                "clase": None,
                "rol": "otra",
                "persona_real": False,
                "rasgos_fijos": [],
                "version": None,
            }
        )
    return salida


async def _resolver_referencias(
    espacio_id: str, pedidas: list[Any]
) -> list[dict[str, Any]]:
    disponibles = {r["medio_id"]: r for r in await _referencias_disponibles(espacio_id)}
    salida = []
    for p in pedidas:
        r = disponibles.get(p.medio_id)
        if not r:
            raise HTTPException(409, "Esa referencia no es de este espacio.")
        medio = await db.medios.find_one({"_id": p.medio_id})
        salida.append({**r, "medio": sin_id(medio) if medio else None})
    return salida


def _prompt_enviado(texto: str, refs: list[dict[str, Any]]) -> str:
    lineas_refs, identidad = constructor_prompt._referencias(refs)
    partes = [texto.strip(), identidad, lineas_refs, f"Sin: {NEGATIVOS_FOTO}.", "Sin texto ni rótulos en la imagen."]
    return "\n".join(p for p in partes if p)


# --- pantalla -----------------------------------------------------------------


@router.get("/espacios/{espacio_id}/taller")
async def taller(espacio_id: str):
    espacio = await _espacio(espacio_id)
    modelos = [
        m.model_dump(mode="json") | {"elegible": cat.elegible(m)}
        for m in cat.catalogo()
        if not m.plantilla and any(a.value in ACCIONES_IMAGEN for a in m.acciones)
    ]
    return {
        "espacio": espacio,
        "carpetas": await _carpetas(espacio_id),
        "referencias": await _referencias_disponibles(espacio_id),
        "modelos": modelos,
        "gasto": await ops.gasto(proyecto_del_taller(espacio_id)),
    }


@router.post("/espacios/{espacio_id}/carpetas", status_code=201)
async def crear_carpeta(espacio_id: str, datos: CarpetaCrear):
    await _espacio(espacio_id)
    nombre = datos.nombre.strip()
    if not nombre:
        raise HTTPException(400, "La carpeta necesita un nombre.")
    orden = len(await _carpetas(espacio_id))
    c = Carpeta(espacio_id=espacio_id, nombre=nombre, orden=orden).model_dump(mode="json")
    c["_id"] = c["id"]
    await db.carpetas.insert_one(c)
    return sin_id(c)


@router.get("/carpetas/{carpeta_id}/tomas")
async def tomas_de_carpeta(carpeta_id: str):
    if not await db.carpetas.find_one({"_id": carpeta_id}):
        raise HTTPException(404, "Carpeta no encontrada")
    tomas = []
    for t in await db.tomas.find({"carpeta_id": carpeta_id}).sort("created_at", -1).to_list(1000):
        op = await db.operaciones.find_one({"_id": t.get("operacion_id") or ""}) or {}
        medio = await db.medios.find_one({"_id": t["medio_id"]})
        tomas.append(
            {
                **sin_id(t),
                "medio": sin_id(medio) if medio else None,
                "modelo": op.get("modelo"),
                "prompt_enviado": op.get("prompt_visible"),
                "texto": (op.get("taller") or {}).get("texto"),
                "referencias": (op.get("taller") or {}).get("referencias") or [],
                "relacion": (op.get("entradas") or {}).get("relacion_aspecto"),
                "coste": op.get("coste_real") if op.get("coste_real") is not None else op.get("coste_estimado"),
            }
        )
    en_marcha = [
        {
            "id": o["_id"],
            "estado": o["estado"],
            "n": (o.get("entradas") or {}).get("n_variantes") or 1,
            "modelo": o.get("modelo"),
            "autorizada_en": o.get("autorizada_en"),
            "error": o.get("error"),
        }
        for o in await db.operaciones.find(
            {"destino.tipo": "taller", "destino.id": carpeta_id, "estado": {"$in": list(EN_MARCHA) + ["incierta", "fallida"]}}
        ).sort("created_at", -1).to_list(50)
        if o["estado"] in EN_MARCHA or not o.get("visto")
    ]
    return {"tomas": tomas, "en_marcha": en_marcha}


# --- ingredientes (18.30) ----------------------------------------------------------

PARTES = {
    "entorno": r"\b(en|dentro|fondo|lugar|interior|exterior|calle|playa|campo|despacho|puente|estudio)\b",
    "cámara": r"\b(plano|primer|encuadre|ángulo|angulo|cenital|picado|contrapicado|mm|objetivo|selfie|retrato)\b",
    "luz": r"\b(luz|iluminad\w*|sol|amanecer|atardecer|lámpara|ventana|ventanal|contraluz|neón|sombra\w*)\b",
    "estilo": r"\b(foto|fotografía|realista|ilustración|óleo|acuarela|cine|película|35 ?mm|estilo|grano)\b",
}


def _niveles_prompt(texto: str) -> dict[str, Any]:
    t = texto.lower()
    faltan = [p for p, rx in PARTES.items() if not re.search(rx, t)]
    sujeto = len(t.split()) >= 6
    if not sujeto:
        faltan.insert(0, "sujeto")
    nivel = "verde" if not faltan else ("ambar" if len(faltan) <= 2 else "rojo")
    motivo = "completo" if not faltan else "falta: " + ", ".join(faltan) + ". «Mejorar» lo completa"
    return {"nombre": "Prompt", "nivel": nivel, "motivo": motivo}


def _nivel_foto(r: dict[str, Any]) -> dict[str, Any]:
    m = r.get("medio") or {}
    corto = min(m.get("ancho") or 0, m.get("alto") or 0)
    nombre = f"Foto de @{r['nombre']}"
    if not corto:
        return {"nombre": nombre, "nivel": "ambar", "motivo": "no se conoce su tamaño"}
    if corto >= 1024:
        return {"nombre": nombre, "nivel": "verde", "motivo": f"{corto} px de lado corto"}
    if corto >= 512:
        return {"nombre": nombre, "nivel": "ambar", "motivo": f"{corto} px: justa; mejor 1024 o más"}
    return {"nombre": nombre, "nivel": "rojo", "motivo": f"{corto} px: muy pequeña, el modelo inventará detalles"}


@router.post("/espacios/{espacio_id}/taller/ingredientes")
async def ingredientes(espacio_id: str, datos: PeticionTaller):
    refs = await _resolver_referencias(espacio_id, datos.referencias)
    return {"ingredientes": [_nivel_foto(r) for r in refs] + [_niveles_prompt(datos.texto)]}


# --- mejorar (asistente real) --------------------------------------------------------

INSTRUCCIONES_MEJORAR = """Eres el director de fotografía de Picasso, un estudio de dirección creativa.
Reescribe el prompt de imagen del usuario para que el modelo de imagen lo clave. Reglas:
1. Conserva su intención y todo lo que pidió. No cambies el sujeto ni la escena.
2. No inventes rasgos de personas: si hay rasgos de ficha, úsalos tal cual y no añadas otros (ni pelo, ni edad, ni ropa que no estén).
3. Completa las seis partes: sujeto, entorno, cámara (tamaño de plano, ángulo, óptica), luz descrita por su fuente (qué la da, desde dónde, cómo es), tono en una o dos palabras, y estilo realista concreto (por ejemplo «foto realista de 35 mm, piel con textura natural»).
4. Nada de palabras de pulido que dan cara de IA: obra maestra, hiperdetallado, 8k, iluminación perfecta, ultrarrealista, premiado.
5. Lo imprescindible primero. Frases cortas. Máximo 110 palabras.
6. No menciones las imágenes de referencia ni el texto «Sin: …»: Picasso añade esas líneas.
7. Escribe en el mismo idioma que el usuario.
Devuelve SOLO un JSON: {"texto": "...", "cambios": [{"parte": "...", "motivo": "..."}]} con 2 a 6 cambios explicados en una frase cada uno."""


@router.post("/espacios/{espacio_id}/taller/mejorar")
async def mejorar(espacio_id: str, datos: PeticionTaller):
    await _espacio(espacio_id)
    if not datos.texto.strip():
        raise HTTPException(400, "Escribe primero qué quieres.")
    refs = await _resolver_referencias(espacio_id, datos.referencias)
    contexto = [f"Prompt del usuario: {datos.texto.strip()}", f"Formato: {datos.relacion}"]
    for r in refs:
        rasgos = "; ".join(r["rasgos_fijos"]) if r["rasgos_fijos"] else "sin rasgos escritos"
        tipo = r["clase"] or "referencia de estilo"
        real = " (persona real)" if r["persona_real"] else ""
        contexto.append(f"@{r['nombre']} = {tipo}{real}. Rasgos de su ficha: {rasgos}")
    try:
        crudo, coste = await openai_texto.completar(INSTRUCCIONES_MEJORAR, "\n".join(contexto))
    except openai_texto.AsistenteNoDisponible as e:
        raise HTTPException(503, str(e)) from e
    try:
        inicio, fin = crudo.index("{"), crudo.rindex("}") + 1
        respuesta = json.loads(crudo[inicio:fin])
        texto = str(respuesta["texto"]).strip()
        cambios = [c for c in respuesta.get("cambios") or [] if isinstance(c, dict)]
    except (ValueError, KeyError, json.JSONDecodeError):
        texto, cambios = crudo.strip(), []
    await db.asistente_usos.insert_one(
        {
            "espacio_id": espacio_id,
            "tarea": "mejorar_prompt",
            "modelo": openai_texto.MODELO,
            "coste": float(coste),
            "created_at": ahora(),
        }
    )
    return {"texto": texto, "cambios": cambios, "coste": round(float(coste), 4)}


# --- generar ---------------------------------------------------------------------------


@router.post("/espacios/{espacio_id}/taller/generar", status_code=201)
async def generar(espacio_id: str, datos: PeticionTaller):
    await _espacio(espacio_id)
    carpeta = await db.carpetas.find_one({"_id": datos.carpeta_id or "", "espacio_id": espacio_id})
    if not carpeta:
        raise HTTPException(404, "Carpeta no encontrada")
    if not datos.texto.strip():
        raise HTTPException(400, "Escribe primero qué quieres.")
    modelo = cat.modelo(datos.modelo or "")
    if modelo is None or not cat.elegible(modelo):
        raise HTTPException(422, "Ese modelo no está disponible.")
    refs = await _resolver_referencias(espacio_id, datos.referencias)
    if refs and not modelo.admite.referencias:
        raise HTTPException(422, "Ese modelo no admite referencias.")
    refs = refs[: modelo.admite.referencias] if modelo.admite.referencias else []
    accion = Accion.imagen_con_referencias if refs else Accion.generar_imagen
    if accion not in modelo.acciones:
        raise HTTPException(422, "Ese modelo no hace esto.")
    prompt = _prompt_enviado(datos.texto, refs)
    ancho, alto = ficheros.medidas(datos.relacion, modelo.formato.png_lado_largo)
    entradas = EntradaOperacion(
        accion=accion,
        modelo=modelo.id,
        prompt=prompt,
        referencias=tuple(
            ReferenciaEntrada(
                medio_id=r["medio_id"],
                ruta=str(almacen.ruta_absoluta(r["medio"]["ruta"])),
                rol=r["rol"],
            )
            for r in refs
            if r.get("medio")
        ),
        relacion_aspecto=datos.relacion,
        resolucion=f"{ancho}x{alto}",
        n_variantes=datos.cuantas,
        etiqueta_destino=f"Taller · {carpeta['nombre']}",
    )
    vista = await ops.crear_operacion(
        proyecto_id=proyecto_del_taller(espacio_id),
        espacio_id=espacio_id,
        destino_tipo="taller",
        destino_id=carpeta["_id"],
        entradas=entradas,
        prompt_visible=prompt,
    )
    op_id = vista["operacion"]["id"]
    await db.operaciones.update_one(
        {"_id": op_id},
        {
            "$set": {
                "taller": {
                    "texto": datos.texto.strip(),
                    "referencias": [r["medio_id"] for r in refs],
                }
            }
        },
    )
    try:
        return await ops.autorizar(op_id, datos.confirmado_por_encima_del_presupuesto)
    except PermissionError as e:
        raise HTTPException(409, str(e)) from e


@router.post("/operaciones/{operacion_id}/visto")
async def marcar_visto(operacion_id: str):
    await db.operaciones.update_one({"_id": operacion_id}, {"$set": {"visto": True}})
    return {"ok": True}
