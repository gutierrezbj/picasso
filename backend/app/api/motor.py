"""API del motor (§9), tomas (§7.6, §7.7d), lámina de encuadres (§8), planos sin
escena (§13) y registro (§9.5). Las pantallas solo hablan con el motor a través
de `Operacion`."""
from __future__ import annotations

import asyncio
import csv
import io
import json
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

from app.almacen import almacen
from app.api.lienzo import (
    _OPCIONES,
    _continuidad,
    _plano,
    _planos_de_escena,
    _prompt,
    _renumerar,
    _reparto_con_ficha,
    _vista_plano,
)
from app.db import db, sin_id
from app.dominio.modelos import (
    Accion,
    Autorizacion,
    EditarOperacion,
    EntradaOperacion,
    FijarExploracion,
    Medio,
    MedioEntrada,
    MoverAEscena,
    PasarAFicha,
    PrepararOperacion,
    ReferenciaEntrada,
    SimulacionPrueba,
    Toma,
    TomaEditar,
    VarianteEncuadre,
    ahora,
)
from app.motor import catalogo as cat
from app.motor import estados, eventos, ficheros
from app.motor import operaciones as ops
from app.motor import worker

router = APIRouter(prefix="/api", tags=["motor"])


def _error_estado(e: estados.TransicionNoPermitida) -> HTTPException:
    return HTTPException(409, str(e))


# --- catálogo ----------------------------------------------------------------


@router.get("/catalogo")
async def ver_catalogo(accion: Optional[str] = None):
    salida: list[dict[str, Any]] = []
    for m in cat.catalogo():
        if accion and accion not in [a.value for a in m.acciones]:
            continue
        proveedor = cat.proveedor_de(m)
        motivo = None
        if m.plantilla:
            motivo = "Plantilla del catálogo: rellénala y quita «plantilla» para poder elegirla."
        elif proveedor is None:
            motivo = "Proveedor no configurado: su clave se lee de una variable de entorno."
        salida.append(
            {
                **m.model_dump(mode="json"),
                "proveedor": proveedor,
                "elegible": cat.elegible(m),
                "motivo_no_elegible": motivo,
                "precio_simulado": not m.coste.verificado,
            }
        )
    return salida


# --- ayudas ------------------------------------------------------------------


async def _pieza_proyecto(pieza_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    pieza = await db.piezas.find_one({"_id": pieza_id})
    if not pieza:
        raise HTTPException(404, "Pieza no encontrada")
    proy = await db.proyectos.find_one({"_id": pieza["proyecto_id"]})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    return sin_id(pieza), sin_id(proy)


async def etiqueta_plano(plano: dict[str, Any]) -> str:
    """«E2·P3» (§7.2). Los planos sin escena van como «SE·Pn» (§13)."""
    if not plano.get("escena_id"):
        huerfanos = await db.planos.find(
            {"pieza_id": plano["pieza_id"], "escena_id": None}
        ).sort("orden", 1).to_list(500)
        i = next((j for j, p in enumerate(huerfanos) if p["_id"] == plano["id"]), 0)
        return f"SE·P{i + 1}"
    escena = await db.escenas.find_one({"_id": plano["escena_id"]})
    if not escena:
        return f"SE·P{plano['orden'] + 1}"
    escenas = await db.escenas.find(
        {"guion_id": escena["guion_id"], "borrador": False}
    ).sort("orden", 1).to_list(500)
    n = next((j for j, e in enumerate(escenas) if e["_id"] == escena["_id"]), 0)
    return f"E{n + 1}·P{plano['orden'] + 1}"


async def _medio(medio_id: Optional[str]) -> Optional[dict[str, Any]]:
    if not medio_id:
        return None
    doc = await db.medios.find_one({"_id": medio_id})
    return sin_id(doc) if doc else None


def _ruta(medio: dict[str, Any]) -> str:
    return str(almacen.ruta_absoluta(medio["ruta"]))


async def _primer_fotograma_encadenado(plano: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Último fotograma de la toma elegida del plano anterior (§3.1)."""
    if not plano.get("plano_anterior_encadenado") or not plano.get("escena_id"):
        return None
    hermanos = await _planos_de_escena(plano["escena_id"])
    indice = next((i for i, p in enumerate(hermanos) if p["id"] == plano["id"]), 0)
    if indice == 0:
        return None
    anterior = hermanos[indice - 1]
    toma = await db.tomas.find_one({"_id": anterior.get("toma_elegida_id") or ""})
    medio = await _medio((toma or {}).get("medio_id"))
    if not medio:
        return None
    if medio["clase"] != "video":
        return medio
    etiqueta = f"ultimo-fotograma:{medio['id']}"
    guardado = await db.medios.find_one({"etiqueta": etiqueta})
    if guardado:
        return sin_id(guardado)
    nuevo = Medio(
        espacio_id=medio["espacio_id"],
        clase="imagen",
        ruta="",
        mime="image/png",
        nombre_original="ultimo-fotograma.png",
        etiqueta=etiqueta,
        origen="generado",
        etiqueta_demo=True,
        hash=etiqueta,
    )
    temporal = Path("/tmp") / f"{nuevo.id}.png"
    await asyncio.to_thread(ficheros.ultimo_fotograma, Path(_ruta(medio)), temporal)
    datos = temporal.read_bytes()
    temporal.unlink(missing_ok=True)
    nuevo.ruta = almacen.guardar(medio["espacio_id"], nuevo.id, ".png", datos)
    doc = nuevo.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.medios.insert_one(doc)
    return sin_id(doc)


def _variantes_encuadre(plano: dict[str, Any], cuantas: int) -> tuple[VarianteEncuadre, ...]:
    """§8: N variantes cambiando SOLO encuadre y ángulo."""
    encuadres: list[str] = list((_OPCIONES.get("encuadre") or {}).get("opciones") or [])
    angulos: list[str] = list((_OPCIONES.get("angulo") or {}).get("opciones") or [])
    d = plano.get("direccion") or {}
    for lista, actual in ((encuadres, d.get("encuadre") or d.get("encuadre_inicio")),
                          (angulos, d.get("angulo") or d.get("angulo_inicio"))):
        if actual and actual in lista:
            lista.remove(actual)
            lista.insert(0, actual)
    salida: list[VarianteEncuadre] = []
    for i in range(max(1, cuantas)):
        salida.append(
            VarianteEncuadre(
                encuadre=encuadres[i % len(encuadres)] if encuadres else None,
                angulo=angulos[(i // max(1, len(encuadres))) % len(angulos)] if angulos else None,
            )
        )
    return tuple(salida)


def _rotulos_direccion(plano: dict[str, Any]) -> tuple[str, ...]:
    d = plano.get("direccion") or {}
    if plano.get("modalidad") == "video":
        inicio = " ".join([t for t in (d.get("encuadre_inicio"), d.get("angulo_inicio")) if t])
        final = " ".join([t for t in (d.get("encuadre_final"), d.get("angulo_final")) if t])
        if inicio or final:
            return (f"{inicio or 'sin definir'} → {final or 'sin definir'}",)
        return ()
    par = " ".join([t for t in (d.get("encuadre"), d.get("angulo")) if t])
    return (par,) if par else ()


async def _construir_entradas(
    plano: dict[str, Any],
    proy: dict[str, Any],
    *,
    accion: Accion,
    modelo_id: str,
    duracion_s: Optional[float] = None,
    instruccion: Optional[str] = None,
    texto: Optional[str] = None,
    n_variantes: int = 1,
    toma_origen_id: Optional[str] = None,
    prompt_manual: Optional[str] = None,
    correccion: Optional[str] = None,
    simular: SimulacionPrueba = SimulacionPrueba.normal,
) -> tuple[EntradaOperacion, str]:
    modelo = cat.modelo(modelo_id)
    if modelo is None:
        raise HTTPException(422, f"El modelo «{modelo_id}» no está en el catálogo.")
    reparto = await _reparto_con_ficha(proy["id"])
    continuidad = await _continuidad(plano, reparto)
    base = prompt_manual if prompt_manual is not None else (await _prompt(plano))["texto"] or ""
    es_video = accion in (Accion.generar_video,)
    prompt = base
    if correccion and (es_video or accion in (Accion.generar_imagen, Accion.imagen_con_referencias)):
        prompt = f"{base}\nCorrección: {correccion}".strip()

    referencias: list[ReferenciaEntrada] = []
    if modelo.admite.referencias:
        for c in continuidad:
            for r in c["referencias"]:
                medio = await _medio(r.get("medio_id"))
                if medio and all(x.medio_id != medio["id"] for x in referencias):
                    referencias.append(
                        ReferenciaEntrada(
                            medio_id=medio["id"], ruta=_ruta(medio), rol=r.get("rol") or "otra"
                        )
                    )
        if es_video and toma_origen_id:
            toma = await db.tomas.find_one({"_id": toma_origen_id})
            medio = await _medio((toma or {}).get("medio_id"))
            if medio:
                referencias.insert(
                    0,
                    ReferenciaEntrada(medio_id=medio["id"], ruta=_ruta(medio), rol="detalle"),
                )
        referencias = referencias[: modelo.admite.referencias]

    imagen_entrada: Optional[MedioEntrada] = None
    if accion == Accion.editar_imagen:
        toma = await db.tomas.find_one({"_id": toma_origen_id or ""})
        medio = await _medio((toma or {}).get("medio_id"))
        if not medio or medio["clase"] != "imagen":
            raise HTTPException(409, "«Editar imagen» necesita una toma de imagen como entrada.")
        imagen_entrada = MedioEntrada(medio_id=medio["id"], ruta=_ruta(medio))

    primer: Optional[MedioEntrada] = None
    if modelo.admite.primer_fotograma:
        medio = await _primer_fotograma_encadenado(plano)
        if medio:
            primer = MedioEntrada(medio_id=medio["id"], ruta=_ruta(medio))

    variantes = _variantes_encuadre(plano, n_variantes) if n_variantes > 1 else ()
    ancho, alto = ficheros.medidas(
        proy.get("formato_video") or "16:9",
        modelo.formato.png_lado_largo if accion != Accion.generar_video else modelo.formato.lado_largo,
    )
    duracion = duracion_s if duracion_s is not None else plano.get("duracion_s")
    if accion == Accion.generar_video and not duracion:
        duracion = modelo.duraciones_s[0] if modelo.duraciones_s else 5.0

    negativos = (plano.get("direccion") or {}).get("negativos")
    comun: dict[str, Any] = {
        "accion": accion,
        "modelo": modelo_id,
        "duracion_s": duracion if accion in (Accion.generar_video,) else None,
        "relacion_aspecto": proy.get("formato_video") or "16:9",
        "resolucion": f"{ancho}x{alto}",
        "n_variantes": max(1, len(variantes) or 1),
        "variantes": variantes,
        "etiqueta_destino": await etiqueta_plano(plano),
        "rotulos": _rotulos_direccion(plano),
        "simular_resultado": simular,
    }
    if accion == Accion.generar_voz:
        entradas = EntradaOperacion(**comun, texto=texto or "")
    elif accion == Accion.editar_imagen:
        entradas = EntradaOperacion(
            **comun, imagen_entrada=imagen_entrada, instruccion=instruccion or correccion or ""
        )
    else:
        entradas = EntradaOperacion(
            **comun,
            prompt=prompt,
            negativos=negativos,
            referencias=tuple(referencias),
            primer_fotograma=primer,
        )
    return entradas, (entradas.prompt or entradas.instruccion or entradas.texto or "")


# --- preparar, editar y autorizar (§9.4) ------------------------------------


VISTAS_POR_CLASE: dict[str, tuple[str, ...]] = {
    "personaje": ("de frente", "de perfil", "de tres cuartos", "de cuerpo entero"),
    "producto": ("de frente", "de lado", "de tres cuartos", "detalle"),
    "escenario": ("vista general", "desde la entrada", "detalle del espacio", "al fondo"),
    "mundo": ("vista general", "desde la entrada", "detalle del espacio", "al fondo"),
    "objeto": ("de frente", "de lado", "de tres cuartos", "detalle"),
}

ENCARGO_POR_CLASE: dict[str, str] = {
    "personaje": "Hoja de personaje: varias vistas del mismo personaje, fondo limpio y luz neutra.",
    "producto": "Photobook del producto: vistas del producto recortado sobre fondo limpio.",
    "escenario": "Lámina del escenario: vistas del espacio, sin personajes.",
    "mundo": "Lámina del mundo: vistas del espacio, sin personajes.",
    "objeto": "Lámina de referencia del objeto: vistas sobre fondo limpio.",
}


async def _ficha_y_elemento(ficha_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    ficha = await db.fichas.find_one({"_id": ficha_id})
    if not ficha:
        raise HTTPException(404, "Ficha no encontrada")
    elemento = await db.elementos.find_one({"_id": ficha["elemento_id"]})
    if not elemento:
        raise HTTPException(404, "Elemento no encontrado")
    return sin_id(ficha), sin_id(elemento)


async def _entradas_de_ficha(
    ficha: dict[str, Any],
    elemento: dict[str, Any],
    proyecto: dict[str, Any],
    datos: PrepararOperacion,
) -> tuple[EntradaOperacion, str]:
    modelo = cat.modelo(datos.modelo)
    if modelo is None:
        raise HTTPException(422, f"El modelo «{datos.modelo}» no está en el catálogo.")
    clase = elemento["clase"]
    vistas = VISTAS_POR_CLASE.get(clase, ("vista 1", "vista 2", "vista 3", "vista 4"))
    cuantas = max(1, min(len(vistas), datos.n_variantes or 4))
    partes = [
        ENCARGO_POR_CLASE.get(clase, "Lámina de referencia."),
        f"{clase.capitalize()}: {elemento['nombre']}.",
    ]
    if ficha.get("descripcion"):
        partes.append(ficha["descripcion"])
    for etiqueta, campo in (
        ("Rasgos fijos", "rasgos_fijos"),
        ("Rasgos variables", "rasgos_variables"),
    ):
        valores = ficha.get(campo) or []
        if valores:
            partes.append(f"{etiqueta}: " + "; ".join(valores) + ".")
    for etiqueta, campo in (
        ("Materiales y colores", "materiales_colores"),
        ("Ambiente", "ambiente"),
        ("Distribución", "distribucion"),
    ):
        if ficha.get(campo):
            partes.append(f"{etiqueta}: {ficha[campo]}.")
    prompt = datos.prompt_manual if datos.prompt_manual is not None else "\n".join(partes)

    referencias: list[ReferenciaEntrada] = []
    if modelo.admite.referencias:
        for r in ficha.get("referencias") or []:
            medio = await _medio(r.get("medio_id"))
            if medio:
                referencias.append(
                    ReferenciaEntrada(
                        medio_id=medio["id"], ruta=_ruta(medio), rol=r.get("rol") or "otra"
                    )
                )
        referencias = referencias[: modelo.admite.referencias]

    accion = (
        Accion.imagen_con_referencias
        if referencias and Accion.imagen_con_referencias in modelo.acciones
        else Accion.generar_imagen
    )
    relacion = "1:1" if "1:1" in modelo.relaciones else (modelo.relaciones[0] if modelo.relaciones else "16:9")
    ancho, alto = ficheros.medidas(relacion, modelo.formato.png_lado_largo)
    entradas = EntradaOperacion(
        accion=accion,
        modelo=modelo.id,
        prompt=prompt,
        referencias=tuple(referencias),
        relacion_aspecto=relacion,
        resolucion=f"{ancho}x{alto}",
        n_variantes=cuantas,
        variantes=tuple(VarianteEncuadre(encuadre=v) for v in vistas[:cuantas]),
        etiqueta_destino=f"{elemento['nombre']} · v{ficha['version']}",
        rotulos=(ENCARGO_POR_CLASE.get(clase, "Lámina de referencia."),),
        simular_resultado=datos.simular_resultado,
    )
    return entradas, prompt


@router.post("/fichas/{ficha_id}/preparar-referencias", status_code=201)
async def preparar_referencias(ficha_id: str, datos: PrepararOperacion):
    """§6.2: «Crear hoja de personaje», «Crear photobook del producto» o «Crear
    lámina del escenario». Prepara una operación del motor con coste visible; no
    envía nada hasta autorizar."""
    ficha, elemento = await _ficha_y_elemento(ficha_id)
    if not datos.proyecto_id:
        raise HTTPException(422, "Falta el proyecto en el que se prepara la lámina.")
    proy = await db.proyectos.find_one({"_id": datos.proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    try:
        entradas, prompt = await _entradas_de_ficha(ficha, elemento, sin_id(proy), datos)
        return await ops.crear_operacion(
            proyecto_id=datos.proyecto_id,
            espacio_id=elemento["espacio_id"],
            destino_tipo="ficha",
            destino_id=ficha_id,
            entradas=entradas,
            prompt_visible=prompt,
        )
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@router.get("/fichas/{ficha_id}/tomas")
async def tomas_de_ficha(ficha_id: str):
    docs = await db.tomas.find({"ficha_version_id": ficha_id}).sort("numero", 1).to_list(500)
    return {"tomas": [await _vista_toma(d) for d in docs]}


@router.post("/tomas/{toma_id}/pasar-a-ficha")
async def pasar_toma_a_ficha(toma_id: str, datos: PasarAFicha):
    """El usuario elige qué tomas de la lámina pasan a ser referencias (§6.2)."""
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc or not doc.get("ficha_version_id"):
        raise HTTPException(404, "Toma de referencias no encontrada")
    ficha = await db.fichas.find_one({"_id": doc["ficha_version_id"]})
    if not ficha:
        raise HTTPException(404, "Ficha no encontrada")
    if ficha["estado"] == "aprobada":
        raise HTTPException(409, "Una versión aprobada no se edita. Crea una versión nueva.")
    referencias = list(ficha.get("referencias") or [])
    if any(r["medio_id"] == doc["medio_id"] for r in referencias):
        raise HTTPException(409, "Esa toma ya es referencia de la ficha.")
    referencias.append({"medio_id": doc["medio_id"], "rol": datos.rol})
    await db.fichas.update_one(
        {"_id": ficha["_id"]},
        {"$set": {"referencias": referencias, "updated_at": ahora()}},
    )
    await db.tomas.update_one(
        {"_id": toma_id}, {"$set": {"valoracion": "buena", "updated_at": ahora()}}
    )
    return sin_id(await db.fichas.find_one({"_id": ficha["_id"]}))


@router.post("/operaciones", status_code=201)
async def preparar_operacion(datos: PrepararOperacion):
    if datos.destino_tipo == "ficha":
        return await preparar_referencias(datos.destino_id, datos)
    if datos.destino_tipo != "plano":
        raise HTTPException(422, "El destino de una operación es un plano o una ficha.")
    plano = await _plano(datos.destino_id)
    _, proy = await _pieza_proyecto(plano["pieza_id"])
    correccion_texto = None
    if datos.correccion_id:
        correccion = next(
            (c for c in plano.get("correcciones") or [] if c["id"] == datos.correccion_id), None
        )
        if not correccion:
            raise HTTPException(404, "Corrección no encontrada")
        correccion_texto = correccion["texto"]
    try:
        entradas, prompt_visible = await _construir_entradas(
            plano,
            proy,
            accion=datos.accion,
            modelo_id=datos.modelo,
            duracion_s=datos.duracion_s,
            instruccion=datos.instruccion,
            texto=datos.texto,
            n_variantes=datos.n_variantes or 1,
            toma_origen_id=datos.toma_origen_id,
            prompt_manual=datos.prompt_manual,
            correccion=correccion_texto,
            simular=datos.simular_resultado,
        )
        return await ops.crear_operacion(
            proyecto_id=proy["id"],
            espacio_id=proy["espacio_id"],
            destino_tipo="plano",
            destino_id=plano["id"],
            entradas=entradas,
            prompt_visible=prompt_visible,
            correccion_id=datos.correccion_id,
            toma_origen_id=datos.toma_origen_id,
            es_exploracion=bool(datos.n_variantes and datos.n_variantes > 1),
        )
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@router.patch("/operaciones/{operacion_id}")
async def editar_operacion(operacion_id: str, datos: EditarOperacion):
    doc = await db.operaciones.find_one({"_id": operacion_id})
    if not doc:
        raise HTTPException(404, "Operación no encontrada")
    op = sin_id(doc)
    previas = EntradaOperacion(**op["entradas"])
    if op["destino"]["tipo"] == "ficha":
        ficha, elemento = await _ficha_y_elemento(op["destino"]["id"])
        proyecto = await db.proyectos.find_one({"_id": op["proyecto_id"]})
        peticion = PrepararOperacion(
            destino_tipo="ficha",
            destino_id=op["destino"]["id"],
            proyecto_id=op["proyecto_id"],
            accion=previas.accion,
            modelo=datos.modelo or op["modelo"],
            n_variantes=datos.n_variantes or previas.n_variantes,
            prompt_manual=datos.prompt_manual if datos.prompt_manual is not None else previas.prompt,
            simular_resultado=datos.simular_resultado or previas.simular_resultado,
        )
        try:
            entradas, prompt = await _entradas_de_ficha(
                ficha, elemento, sin_id(proyecto) if proyecto else {}, peticion
            )
            return await ops.editar(operacion_id, entradas, prompt)
        except estados.TransicionNoPermitida as e:
            raise _error_estado(e) from e
        except ValueError as e:
            raise HTTPException(422, str(e)) from e
    plano = await _plano(op["destino"]["id"])
    _, proy = await _pieza_proyecto(plano["pieza_id"])
    correccion_texto = None
    if op.get("correccion_id"):
        correccion = next(
            (c for c in plano.get("correcciones") or [] if c["id"] == op["correccion_id"]), None
        )
        correccion_texto = (correccion or {}).get("texto")
    try:
        entradas, prompt_visible = await _construir_entradas(
            plano,
            proy,
            accion=previas.accion,
            modelo_id=datos.modelo or op["modelo"],
            duracion_s=datos.duracion_s if datos.duracion_s is not None else previas.duracion_s,
            instruccion=datos.instruccion or previas.instruccion,
            texto=datos.texto or previas.texto,
            n_variantes=datos.n_variantes or previas.n_variantes,
            toma_origen_id=op.get("toma_origen_id"),
            prompt_manual=datos.prompt_manual
            if datos.prompt_manual is not None
            else previas.prompt,
            correccion=correccion_texto,
            simular=datos.simular_resultado or previas.simular_resultado,
        )
        return await ops.editar(operacion_id, entradas, prompt_visible)
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@router.post("/operaciones/{operacion_id}/autorizar")
async def autorizar_operacion(operacion_id: str, datos: Autorizacion | None = None):
    try:
        return await ops.autorizar(
            operacion_id, bool(datos and datos.confirmado_por_encima_del_presupuesto)
        )
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e
    except PermissionError as e:
        raise HTTPException(409, str(e)) from e
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@router.post("/operaciones/{operacion_id}/comprobar")
async def comprobar_operacion(operacion_id: str):
    try:
        return await worker.comprobar(operacion_id)
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@router.post("/operaciones/{operacion_id}/marcar-fallida")
async def marcar_fallida(operacion_id: str):
    try:
        return await ops.marcar_fallida(operacion_id)
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e


@router.post("/operaciones/{operacion_id}/reintentar")
async def reintentar_operacion(operacion_id: str):
    try:
        return await ops.reintentar(operacion_id)
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e


@router.delete("/operaciones/{operacion_id}")
async def descartar_operacion(operacion_id: str):
    doc = await db.operaciones.find_one({"_id": operacion_id})
    if not doc:
        raise HTTPException(404, "Operación no encontrada")
    try:
        return await ops.guardar_estado(operacion_id, "descartada")
    except estados.TransicionNoPermitida as e:
        raise _error_estado(e) from e


# --- pestaña Producir --------------------------------------------------------


@router.get("/planos/{plano_id}/produccion")
async def produccion_de_plano(plano_id: str):
    plano = await _plano(plano_id)
    _, proy = await _pieza_proyecto(plano["pieza_id"])
    docs = await db.operaciones.find({"destino.id": plano_id}).sort("created_at", -1).to_list(200)
    return {
        "etiqueta": await etiqueta_plano(plano),
        "relacion": proy.get("formato_video") or "16:9",
        "presupuesto": await ops.presupuesto(proy["id"], None),
        "operaciones": [await _vista_operacion(d) for d in docs],
        "prompt": (await _prompt(plano))["texto"],
    }


@router.post("/planos/{plano_id}/explorar-encuadres", status_code=201)
async def explorar_encuadres(plano_id: str, datos: PrepararOperacion):
    """§8: una sola operación que produce N imágenes variando solo encuadre y
    ángulo. Son tomas de exploración, aparte de las tomas del plano."""
    datos.destino_id = plano_id
    datos.accion = Accion.generar_imagen
    datos.n_variantes = max(2, min(8, datos.n_variantes or 4))
    return await preparar_operacion(datos)


@router.post("/correcciones/{correccion_id}/preparar", status_code=201)
async def preparar_correccion(correccion_id: str, datos: PrepararOperacion):
    """§7.7d: la corrección se convierte en una operación con coste, enlazada a
    ella. Se queda preparada: no se envía nada hasta autorizar."""
    doc = await db.planos.find_one({"correcciones.id": correccion_id})
    if not doc:
        raise HTTPException(404, "Corrección no encontrada")
    plano = sin_id(doc)
    correccion = next(c for c in plano["correcciones"] if c["id"] == correccion_id)
    if correccion["estado"] != "pendiente":
        raise HTTPException(409, "Esa corrección ya está hecha.")
    datos.destino_id = plano["id"]
    datos.correccion_id = correccion_id
    if datos.toma_origen_id is None:
        datos.toma_origen_id = plano.get("toma_elegida_id")
    if datos.accion == Accion.editar_imagen and not datos.toma_origen_id:
        raise HTTPException(
            409,
            "Este plano aún no tiene toma elegida: produce primero y la corrección "
            "se sumará al prompt.",
        )
    return await preparar_operacion(datos)


# --- tomas (§7.6, §7.7d) -----------------------------------------------------


async def _vista_toma(doc: dict[str, Any]) -> dict[str, Any]:
    toma = sin_id(doc)
    op = await db.operaciones.find_one({"_id": toma.get("operacion_id") or ""})
    return {
        **toma,
        "medio": await _medio(toma["medio_id"]),
        "modelo": (op or {}).get("modelo"),
        "accion": (op or {}).get("accion"),
    }


@router.get("/planos/{plano_id}/tomas")
async def tomas_de_plano(plano_id: str):
    plano = await _plano(plano_id)
    docs = await db.tomas.find({"plano_id": plano_id}).sort("numero", 1).to_list(500)
    tomas = [await _vista_toma(d) for d in docs]
    return {
        "toma_elegida_id": plano.get("toma_elegida_id"),
        "tomas": [t for t in tomas if not t.get("es_exploracion")],
        "exploraciones": [t for t in tomas if t.get("es_exploracion")],
    }


async def _devolver_plano(plano_id: str) -> dict[str, Any]:
    plano = await _plano(plano_id)
    _, proy = await _pieza_proyecto(plano["pieza_id"])
    eventos.publicar(proy["id"], {"tipo": "plano", "plano_id": plano_id})
    return await _vista_plano(plano, await _reparto_con_ficha(proy["id"]))


@router.post("/tomas/{toma_id}/elegir")
async def elegir_toma(toma_id: str):
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc:
        raise HTTPException(404, "Toma no encontrada")
    if doc.get("es_exploracion"):
        raise HTTPException(
            409,
            "Es una toma de exploración: fija su encuadre o pulsa «Usar como toma del plano».",
        )
    plano = await db.planos.find_one({"_id": doc["plano_id"]})
    if not plano:
        raise HTTPException(404, "Plano no encontrado")
    cambios: dict[str, Any] = {"toma_elegida_id": toma_id, "updated_at": ahora()}
    if doc.get("correccion_id"):
        # La corrección que produjo esta toma se marca «Hecha» sola (§7.7d).
        cambios["correcciones"] = [
            {**c, "estado": "hecha", "hecha_en": ahora()}
            if c["id"] == doc["correccion_id"] and c["estado"] == "pendiente"
            else c
            for c in plano.get("correcciones") or []
        ]
    await db.planos.update_one({"_id": plano["_id"]}, {"$set": cambios})
    return await _devolver_plano(plano["_id"])


@router.patch("/tomas/{toma_id}")
async def editar_toma(toma_id: str, datos: TomaEditar):
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc:
        raise HTTPException(404, "Toma no encontrada")
    cambios: dict[str, Any] = {"updated_at": ahora()}
    if datos.valoracion is not None:
        if datos.valoracion not in ("buena", "descartada", "ninguna"):
            raise HTTPException(422, "Valoración no válida.")
        cambios["valoracion"] = None if datos.valoracion == "ninguna" else datos.valoracion
    if datos.nota is not None:
        cambios["nota"] = datos.nota
    await db.tomas.update_one({"_id": toma_id}, {"$set": cambios})
    return await _vista_toma(await db.tomas.find_one({"_id": toma_id}))


@router.post("/tomas/{toma_id}/ajustar", status_code=201)
async def ajustar_toma(toma_id: str, datos: PrepararOperacion):
    """§7.6: `Ajustar` sobre una toma de imagen prepara `editar_imagen` con esa
    toma como entrada. El resultado es una toma nueva; la original se conserva."""
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc:
        raise HTTPException(404, "Toma no encontrada")
    medio = await _medio(doc["medio_id"])
    if not medio or medio["clase"] != "imagen":
        raise HTTPException(409, "Solo se ajustan tomas de imagen.")
    if not (datos.instruccion or "").strip():
        raise HTTPException(422, "Escribe qué hay que ajustar.")
    datos.destino_id = doc["plano_id"]
    datos.accion = Accion.editar_imagen
    datos.toma_origen_id = toma_id
    datos.n_variantes = 1
    return await preparar_operacion(datos)


# --- exploraciones (§8) ------------------------------------------------------


@router.post("/exploraciones/{toma_id}/fijar")
async def fijar_exploracion(toma_id: str, datos: FijarExploracion):
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc or not doc.get("es_exploracion"):
        raise HTTPException(404, "Toma de exploración no encontrada")
    plano = await db.planos.find_one({"_id": doc["plano_id"]})
    if not plano:
        raise HTTPException(404, "Plano no encontrado")
    exploracion = doc.get("exploracion") or {}
    d = dict(plano.get("direccion") or {})
    if plano["modalidad"] == "video":
        if datos.momento not in ("inicio", "final"):
            raise HTTPException(422, "Indica «inicio» o «final».")
        d[f"encuadre_{datos.momento}"] = exploracion.get("encuadre") or d.get(
            f"encuadre_{datos.momento}"
        )
        d[f"angulo_{datos.momento}"] = exploracion.get("angulo") or d.get(
            f"angulo_{datos.momento}"
        )
    else:
        d["encuadre"] = exploracion.get("encuadre") or d.get("encuadre")
        d["angulo"] = exploracion.get("angulo") or d.get("angulo")
    await db.planos.update_one(
        {"_id": plano["_id"]}, {"$set": {"direccion": d, "updated_at": ahora()}}
    )
    return await _devolver_plano(plano["_id"])


@router.post("/exploraciones/{toma_id}/usar-como-toma")
async def usar_exploracion_como_toma(toma_id: str):
    doc = await db.tomas.find_one({"_id": toma_id})
    if not doc or not doc.get("es_exploracion"):
        raise HTTPException(404, "Toma de exploración no encontrada")
    numero = await db.tomas.count_documents(
        {"plano_id": doc["plano_id"], "es_exploracion": False}
    )
    nueva = Toma(
        plano_id=doc["plano_id"],
        medio_id=doc["medio_id"],
        operacion_id=doc.get("operacion_id"),
        numero=numero + 1,
        fichas_usadas=doc.get("fichas_usadas") or {},
        revision_guion=doc.get("revision_guion") or 0,
        es_exploracion=False,
        exploracion=doc.get("exploracion"),
        nota="Viene de la lámina de encuadres.",
    )
    creada = nueva.model_dump(mode="json")
    creada["_id"] = creada["id"]
    await db.tomas.insert_one(creada)
    return await _vista_toma(creada)


# --- planos sin escena (§13) -------------------------------------------------


@router.post("/planos/{plano_id}/mover-a-escena")
async def mover_a_escena(plano_id: str, datos: MoverAEscena):
    plano = await _plano(plano_id)
    escena = await db.escenas.find_one({"_id": datos.escena_id})
    if not escena:
        raise HTTPException(404, "Escena no encontrada")
    if escena.get("borrador"):
        raise HTTPException(409, "Los planos viven en las escenas del guion aprobado.")
    hermanos = await _planos_de_escena(datos.escena_id)
    await db.planos.update_one(
        {"_id": plano_id},
        {
            "$set": {
                "escena_id": datos.escena_id,
                "orden": len(hermanos),
                "plano_anterior_encadenado": False,
                "updated_at": ahora(),
            }
        },
    )
    if plano.get("escena_id"):
        await _renumerar(plano["escena_id"])
    return await _devolver_plano(plano_id)


# --- registro (§9.5) ---------------------------------------------------------


async def _vista_operacion(doc: dict[str, Any]) -> dict[str, Any]:
    op = sin_id(doc)
    intentos = await db.intentos.find({"operacion_id": op["id"]}).sort("numero", 1).to_list(50)
    modelo = cat.modelo(op["modelo"])
    destino_etiqueta = None
    if op["destino"]["tipo"] == "plano":
        plano = await db.planos.find_one({"_id": op["destino"]["id"]})
        if plano:
            destino_etiqueta = await etiqueta_plano(sin_id(plano))
    elif op["destino"]["tipo"] == "ficha":
        destino_etiqueta = op["entradas"].get("etiqueta_destino") or "ficha"
    proy = await db.proyectos.find_one({"_id": op["proyecto_id"]})
    esp = await db.espacios.find_one({"_id": op["espacio_id"]})
    tomas = await db.tomas.find({"operacion_id": op["id"]}).sort("numero", 1).to_list(50)
    correccion_texto = None
    if op.get("correccion_id"):
        con = await db.planos.find_one({"correcciones.id": op["correccion_id"]})
        if con:
            correccion_texto = next(
                (
                    c["texto"]
                    for c in con.get("correcciones") or []
                    if c["id"] == op["correccion_id"]
                ),
                None,
            )
    return {
        **op,
        "correccion_texto": correccion_texto,
        "modelo_visible": modelo.nombre_visible if modelo else op["modelo"],
        "precio_simulado": (not modelo.coste.verificado) if modelo else True,
        "destino_etiqueta": destino_etiqueta,
        "proyecto_nombre": (proy or {}).get("nombre"),
        "espacio_nombre": (esp or {}).get("nombre"),
        "numero_intentos": len(intentos),
        "intentos_detalle": [sin_id(i) for i in intentos],
        "tomas": [await _vista_toma(t) for t in tomas],
    }


def _filtro_registro(
    espacio_id: Optional[str],
    proyecto_id: Optional[str],
    estado: Optional[str],
    desde: Optional[str],
    hasta: Optional[str],
    destino_id: Optional[str] = None,
) -> dict[str, Any]:
    filtro: dict[str, Any] = {}
    if espacio_id:
        filtro["espacio_id"] = espacio_id
    if proyecto_id:
        filtro["proyecto_id"] = proyecto_id
    if estado:
        filtro["estado"] = estado
    if destino_id:
        filtro["destino.id"] = destino_id
    if desde or hasta:
        rango: dict[str, str] = {}
        if desde:
            rango["$gte"] = desde
        if hasta:
            rango["$lte"] = hasta + "T23:59:59"
        filtro["created_at"] = rango
    return filtro


@router.get("/operaciones")
async def listar_operaciones(
    espacio_id: Optional[str] = None,
    proyecto_id: Optional[str] = None,
    estado: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    destino_id: Optional[str] = None,
):
    filtro = _filtro_registro(espacio_id, proyecto_id, estado, desde, hasta, destino_id)
    docs = await db.operaciones.find(filtro).sort("created_at", -1).to_list(1000)
    return [await _vista_operacion(d) for d in docs]


def _coste_contado(op: dict[str, Any]) -> Optional[float]:
    if op["estado"] == "completada":
        if op.get("coste_real") is not None:
            return float(op["coste_real"])
        if op.get("coste_estimado") is not None:
            return float(op["coste_estimado"])
        return None
    if op["estado"] in ops.ESTADOS_RESERVA and op.get("coste_estimado") is not None:
        return float(op["coste_estimado"])
    return None


@router.get("/registro/totales")
async def totales_registro(
    espacio_id: Optional[str] = None,
    proyecto_id: Optional[str] = None,
    estado: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
):
    filtro = _filtro_registro(espacio_id, proyecto_id, estado, desde, hasta)
    docs = await db.operaciones.find(filtro).to_list(5000)
    por_proyecto: dict[str, float] = {}
    por_espacio: dict[str, float] = {}
    sin_verificar = 0
    total = 0.0
    for d in docs:
        coste = _coste_contado(d)
        if coste is None:
            if d["estado"] in ("completada",) + ops.ESTADOS_RESERVA:
                sin_verificar += 1
            continue
        total += coste
        por_proyecto[d["proyecto_id"]] = round(por_proyecto.get(d["proyecto_id"], 0) + coste, 4)
        por_espacio[d["espacio_id"]] = round(por_espacio.get(d["espacio_id"], 0) + coste, 4)
    nombres_p = {
        p["_id"]: p["nombre"]
        for p in await db.proyectos.find({"_id": {"$in": list(por_proyecto)}}).to_list(500)
    }
    nombres_e = {
        e["_id"]: e["nombre"]
        for e in await db.espacios.find({"_id": {"$in": list(por_espacio)}}).to_list(500)
    }
    aj = await db.ajustes.find_one({"_id": "global"})
    return {
        "total": round(total, 4),
        "operaciones": len(docs),
        "sin_verificar": sin_verificar,
        "moneda": (aj or {}).get("moneda") or "USD",
        "por_proyecto": [
            {"proyecto_id": k, "nombre": nombres_p.get(k, "—"), "total": v}
            for k, v in sorted(por_proyecto.items(), key=lambda x: -x[1])
        ],
        "por_espacio": [
            {"espacio_id": k, "nombre": nombres_e.get(k, "—"), "total": v}
            for k, v in sorted(por_espacio.items(), key=lambda x: -x[1])
        ],
    }


@router.get("/registro/exportar.csv")
async def exportar_registro(
    espacio_id: Optional[str] = None,
    proyecto_id: Optional[str] = None,
    estado: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
):
    filtro = _filtro_registro(espacio_id, proyecto_id, estado, desde, hasta)
    docs = await db.operaciones.find(filtro).sort("created_at", -1).to_list(5000)
    salida = io.StringIO()
    escritor = csv.writer(salida, delimiter=";")
    escritor.writerow(
        [
            "fecha", "espacio", "proyecto", "destino", "accion", "modelo", "proveedor",
            "coste_estimado", "coste_real", "estado", "intentos",
        ]
    )
    for d in docs:
        v = await _vista_operacion(d)
        escritor.writerow(
            [
                v["created_at"], v["espacio_nombre"], v["proyecto_nombre"],
                v["destino_etiqueta"] or v["destino"]["id"], v["accion"], v["modelo"],
                v["proveedor"],
                "" if v["coste_estimado"] is None else v["coste_estimado"],
                "" if v.get("coste_real") is None else v["coste_real"],
                v["estado"], v["numero_intentos"],
            ]
        )
    return Response(
        content=salida.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="registro.csv"'},
    )


@router.get("/proyectos/{proyecto_id}/gasto")
async def gasto_de_proyecto(proyecto_id: str):
    return await ops.presupuesto(proyecto_id, None)


# --- SSE (§15.1): solo del proyecto que se está viendo -----------------------


@router.get("/eventos")
async def stream_eventos(request: Request, proyecto_id: str):
    cola = eventos.suscribir(proyecto_id)

    async def generador():
        try:
            yield "retry: 3000\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    evento = await asyncio.wait_for(cola.get(), timeout=15)
                    yield f"data: {json.dumps(evento, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    yield ": latido\n\n"
        finally:
            eventos.cancelar(proyecto_id, cola)

    return StreamingResponse(
        generador(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
