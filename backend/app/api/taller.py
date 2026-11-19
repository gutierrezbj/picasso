"""El Taller (§6.5, 18.29): generar en una pantalla, con carpetas.

Las operaciones van al motor de siempre: destino {tipo: "taller", id: carpeta}
y proyecto_id `taller:{espacio}`, para que el gasto lleve su propia cuenta."""
from __future__ import annotations

import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Response

from app.almacen import almacen
from app.db import db, sin_id
from app.dominio import prompt as constructor_prompt
from app.dominio.modelos import (
    Accion,
    Carpeta,
    CarpetaCrear,
    EntradaOperacion,
    MedioEntrada,
    PeticionTaller,
    PrepararOperacion,
    ReferenciaEntrada,
)
from app.motor import catalogo as cat
from app.motor import ficheros
from app.motor import operaciones as ops
from app.motor import estados

router = APIRouter(prefix="/api", tags=["taller"])

NEGATIVOS_FOTO = "piel plástica o sobrepulida, aspecto de IA, brillo de estudio artificial"
ACCIONES_IMAGEN = (Accion.generar_imagen.value, Accion.imagen_con_referencias.value)
EN_MARCHA = ("autorizada", "enviada", "en_curso")
DIRECCION_NUEVA = {"encuadre": "Encuadre", "angulo": "Ángulo", "luz": "Luz", "optica": "Óptica"}
ZONAS = {"cabeza": "la cabeza", "ropa": "la ropa", "fondo": "el fondo", "luz": "la luz", "libre": None}
CLAUSULA = (
    "Aplica exactamente el cambio pedido, incluido lo que afecte a la persona, la ropa, "
    "el fondo o la luz si se pide. En lo que no se pida cambiar, intenta mantener la imagen como está."
)


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


def _direccion_nueva(direccion: dict[str, str]) -> dict[str, str]:
    limpia = {}
    for clave, valor in (direccion or {}).items():
        if clave not in DIRECCION_NUEVA:
            raise HTTPException(422, f"«{clave}» no es un control de dirección.")
        valor = str(valor).strip()[:60]
        if valor:
            limpia[clave] = valor
    return limpia


def _prompt_enviado(texto: str, refs: list[dict[str, Any]], direccion: Optional[dict[str, str]] = None) -> str:
    lineas_refs, identidad = constructor_prompt._referencias(refs)
    lineas_dir = " ".join(f"{DIRECCION_NUEVA[k]}: {v}." for k, v in (direccion or {}).items())
    partes = [texto.strip(), lineas_dir, identidad, lineas_refs, f"Sin: {NEGATIVOS_FOTO}.", "Sin texto ni rótulos en la imagen."]
    return "\n".join(p for p in partes if p)


def modelo_para_editar(modelo_id: Optional[str]) -> Optional[str]:
    """El modelo con que se edita una versión: el suyo si edita; si no, el primero
    elegible que edite con el mismo proveedor."""
    m = cat.modelo(modelo_id or "")
    if m and Accion.editar_imagen in m.acciones and cat.elegible(m):
        return m.id
    proveedores = set(m.proveedores) if m else set()
    for c in cat.catalogo():
        if not c.plantilla and cat.elegible(c) and Accion.editar_imagen in c.acciones and proveedores & set(c.proveedores):
            return c.id
    return None


# --- pantalla -----------------------------------------------------------------


@router.get("/espacios/{espacio_id}/taller")
async def taller(espacio_id: str):
    espacio = await _espacio(espacio_id)
    modelos = [
        m.model_dump(mode="json") | {"elegible": cat.elegible(m), "limite_lote": cat.limite_lote(m)}
        for m in cat.catalogo()
        if not m.plantilla and any(a.value in ACCIONES_IMAGEN + (Accion.editar_imagen.value,) for a in m.acciones)
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
    docs = await db.tomas.find({"carpeta_id": carpeta_id}).sort("created_at", -1).to_list(1000)
    abiertas = [
        o
        for o in await db.operaciones.find(
            {"destino.tipo": "taller", "destino.id": carpeta_id, "estado": {"$in": list(EN_MARCHA) + ["incierta", "fallida", "presupuestada"]}}
        ).sort("created_at", -1).to_list(50)
        if o["estado"] in EN_MARCHA
        or o["estado"] == "presupuestada"
        or (o["estado"] in ("incierta", "fallida") and not o.get("visto"))
    ]
    ops_tomas = {
        o["_id"]: o
        for o in await db.operaciones.find(
            {"_id": {"$in": [t.get("operacion_id") for t in docs if t.get("operacion_id")]}}
        ).to_list(2000)
    }
    intentos = await ops.intentos_por_operacion(list(ops_tomas) + [o["_id"] for o in abiertas])
    tomas = []
    for t in docs:
        op = ops_tomas.get(t.get("operacion_id") or "") or {}
        medio = await db.medios.find_one({"_id": t["medio_id"]})
        entradas = op.get("entradas") or {}
        tomas.append(
            {
                **sin_id(t),
                "medio": sin_id(medio) if medio else None,
                "modelo": op.get("modelo"),
                "modelo_edicion": modelo_para_editar(op.get("modelo")),
                "accion": op.get("accion"),
                "origen_toma_id": op.get("toma_origen_id"),
                "prompt_enviado": op.get("prompt_visible"),
                "texto": (op.get("taller") or {}).get("texto"),
                "referencias": (op.get("taller") or {}).get("referencias") or [],
                "direccion": (op.get("taller") or {}).get("direccion") or {},
                "enviadas": {
                    "imagen": (entradas.get("imagen_entrada") or {}).get("medio_id"),
                    "referencias": [r["medio_id"] for r in entradas.get("referencias") or []],
                },
                "relacion": entradas.get("relacion_aspecto"),
                "coste": ops.coste_de(op, intentos.get(op["_id"], [])) if op else None,
            }
        )
    en_marcha = [
        {
            "id": o["_id"],
            "estado": o["estado"],
            "n": (o.get("entradas") or {}).get("n_variantes") or 1,
            "modelo": o.get("modelo"),
            "accion": o.get("accion"),
            "origen_toma_id": o.get("toma_origen_id"),
            "texto": (o.get("taller") or {}).get("texto"),
            "relacion": (o.get("entradas") or {}).get("relacion_aspecto"),
            "created_at": o.get("created_at"),
            "autorizada_en": o.get("autorizada_en"),
            "error": o.get("error"),
            "intentos": int(o.get("intentos") or 0),
            "coste": ops.coste_de(o, intentos.get(o["_id"], [])),
        }
        for o in abiertas
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
    return {"nombre": "Prompt", "nivel": nivel, "motivo": motivo, "faltan": faltan}


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


# --- generar ---------------------------------------------------------------------------


@router.post("/espacios/{espacio_id}/taller/generar", status_code=201)
async def generar(espacio_id: str, datos: PeticionTaller, response: Response):
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
    limite = cat.limite_lote(modelo)
    if datos.cuantas > limite:
        raise HTTPException(422, f"Este modelo admite como mucho {limite} por petición del Taller.")
    direccion = _direccion_nueva(datos.direccion)
    prompt = _prompt_enviado(datos.texto, refs, direccion)
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
        simular_resultado=datos.simular_resultado,
    )
    taller_info = {
        "texto": datos.texto.strip(),
        "referencias": [r["medio_id"] for r in refs],
        "direccion": direccion,
    }
    try:
        vista = await ops.crear_operacion(
            proyecto_id=proyecto_del_taller(espacio_id),
            espacio_id=espacio_id,
            destino_tipo="taller",
            destino_id=carpeta["_id"],
            entradas=entradas,
            prompt_visible=prompt,
            id_peticion=datos.id_peticion,
            extra={"taller": taller_info},
        )
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    return await _autorizar_nueva(vista, datos.confirmado_por_encima_del_presupuesto, response)


async def _autorizar_nueva(vista: dict[str, Any], confirmado: bool, response: Response) -> dict[str, Any]:
    """La primera petición autoriza. Una repetición (mismo `id_peticion`) recupera
    la operación: si quedó presupuestada sin ningún intento (falló su
    autorización, por ejemplo por el presupuesto), la autoriza ahora."""
    op = vista["operacion"]
    if vista.get("repetida"):
        response.status_code = 200
        if op["estado"] != "presupuestada" or int(op.get("intentos") or 0) > 0:
            return vista
    try:
        resultado = await ops.autorizar(op["id"], confirmado)
    except PermissionError as e:
        raise HTTPException(409, str(e)) from e
    except estados.TransicionNoPermitida:
        resultado = await ops.vista(sin_id(await db.operaciones.find_one({"_id": op["id"]})))
    return {**resultado, "repetida": True} if vista.get("repetida") else resultado


async def editar_en_carpeta(toma: dict[str, Any], datos: PrepararOperacion, response: Response) -> dict[str, Any]:
    """PIC-03: Ajustar desde el Taller. El destino es la carpeta de la versión de
    origen; se prepara y se autoriza con un solo clic, con su `id_peticion`."""
    carpeta = await db.carpetas.find_one({"_id": toma["carpeta_id"]})
    if not carpeta:
        raise HTTPException(404, "Carpeta no encontrada")
    modelo = cat.modelo(datos.modelo or "")
    if modelo is None or not cat.elegible(modelo) or Accion.editar_imagen not in modelo.acciones:
        raise HTTPException(422, "Ese modelo no edita imágenes.")
    medio = await db.medios.find_one({"_id": toma["medio_id"]})
    if not medio or medio.get("clase") != "imagen":
        raise HTTPException(409, "Solo se editan versiones de imagen.")
    zona = (datos.zona or "").strip().lower() or None
    if zona and zona not in ZONAS:
        raise HTTPException(422, "Esa zona del cambio no existe.")
    texto = (datos.instruccion or "").strip()
    origen = await db.operaciones.find_one({"_id": toma.get("operacion_id") or ""}) or {}
    relacion = (origen.get("entradas") or {}).get("relacion_aspecto") or "9:16"
    instruccion = "\n".join(
        p for p in [texto, f"Zona del cambio: {ZONAS[zona]}." if zona and ZONAS[zona] else "", CLAUSULA] if p
    )
    ancho, alto = ficheros.medidas(relacion, modelo.formato.png_lado_largo)
    try:
        entradas = EntradaOperacion(
            accion=Accion.editar_imagen,
            modelo=modelo.id,
            imagen_entrada=MedioEntrada(medio_id=medio["_id"], ruta=str(almacen.ruta_absoluta(medio["ruta"]))),
            instruccion=instruccion,
            relacion_aspecto=relacion,
            resolucion=f"{ancho}x{alto}",
            n_variantes=1,
            etiqueta_destino=f"Taller · {carpeta['nombre']}",
            simular_resultado=datos.simular_resultado,
        )
        vista = await ops.crear_operacion(
            proyecto_id=proyecto_del_taller(carpeta["espacio_id"]),
            espacio_id=carpeta["espacio_id"],
            destino_tipo="taller",
            destino_id=carpeta["_id"],
            entradas=entradas,
            prompt_visible=instruccion,
            toma_origen_id=toma["_id"],
            id_peticion=datos.id_peticion,
            extra={"taller": {"texto": texto, "referencias": [], "direccion": {"zona": zona} if zona else {}}},
        )
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    return await _autorizar_nueva(vista, datos.confirmado_por_encima_del_presupuesto, response)


@router.get("/espacios/{espacio_id}/peticiones/{id_peticion}")
async def peticion(espacio_id: str, id_peticion: str):
    """PIC-03 §5.3: reconciliar una petición que se quedó sin respuesta. 404 = el
    servidor no la recibió y se puede repetir con el mismo identificador."""
    vista = await ops.por_peticion(espacio_id, id_peticion)
    if not vista:
        raise HTTPException(404, "El servidor no recibió esa petición.")
    return vista


@router.post("/operaciones/{operacion_id}/visto")
async def marcar_visto(operacion_id: str):
    await db.operaciones.update_one({"_id": operacion_id}, {"$set": {"visto": True}})
    return {"ok": True}
