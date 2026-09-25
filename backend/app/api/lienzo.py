"""Lienzo, planos y dirección (§7, §7.7, §8). Fase 5: sin producción.

El lienzo trabaja siempre con el guion **aprobado** (§6.3): las escenas que se ven
son las aprobadas, aunque haya una revisión en curso. Posición ≠ orden (§7.4): las
posiciones viven en LayoutLienzo y el orden narrativo solo cambia con «Mover
antes/después».
"""
from __future__ import annotations

from pathlib import Path

import yaml
from fastapi import APIRouter, HTTPException

from app.config import DATA_DIR_YAML
from app.db import db, sin_id
from app.dominio import prompt as constructor_prompt
from app.dominio.modelos import (
    Correccion,
    CorreccionCrear,
    CorreccionEditar,
    LayoutLienzo,
    MoverPlano,
    Plano,
    PlanoCrear,
    PlanoEditar,
    PromptManual,
    ahora,
)

router = APIRouter(prefix="/api", tags=["lienzo"])

_OPCIONES = yaml.safe_load(
    Path(DATA_DIR_YAML / "opciones_direccion.yaml").read_text(encoding="utf-8")
)


# --- ayudas ------------------------------------------------------------------


async def _pieza(pieza_id: str) -> dict:
    doc = await db.piezas.find_one({"_id": pieza_id})
    if not doc:
        raise HTTPException(404, "Pieza no encontrada")
    return sin_id(doc)


async def _guion_de(pieza_id: str) -> dict:
    doc = await db.guiones.find_one({"pieza_id": pieza_id})
    if not doc:
        raise HTTPException(404, "Guion no encontrado")
    return sin_id(doc)


async def _plano(plano_id: str) -> dict:
    doc = await db.planos.find_one({"_id": plano_id})
    if not doc:
        raise HTTPException(404, "Plano no encontrado")
    return sin_id(doc)


async def _planos_de_escena(escena_id: str) -> list[dict]:
    docs = await db.planos.find({"escena_id": escena_id}).sort("orden", 1).to_list(500)
    return [sin_id(d) for d in docs]


async def _renumerar(escena_id: str) -> list[dict]:
    planos = await _planos_de_escena(escena_id)
    for i, p in enumerate(planos):
        if p["orden"] != i:
            await db.planos.update_one({"_id": p["id"]}, {"$set": {"orden": i}})
            p["orden"] = i
    return planos


async def _reparto_con_ficha(proyecto_id: str) -> list[dict]:
    """Entradas del reparto con su ficha fijada y su referencia principal (§7.1)."""
    entradas = await db.reparto.find({"proyecto_id": proyecto_id}).to_list(1000)
    salida: list[dict] = []
    for e in entradas:
        el = await db.elementos.find_one({"_id": e["elemento_id"]})
        if not el:
            continue
        ficha = await db.fichas.find_one(
            {"elemento_id": e["elemento_id"], "version": e["version_ficha"]}
        )
        refs = (ficha or {}).get("referencias") or []
        principal = next((r for r in refs if r.get("rol") == "frontal"), refs[0] if refs else None)
        salida.append(
            {
                **sin_id(e),
                "elemento": sin_id(el),
                "ficha": sin_id(ficha) if ficha else None,
                "referencia_principal": (principal or {}).get("medio_id"),
            }
        )
    salida.sort(key=lambda x: (x["elemento"]["clase"], x["elemento"]["nombre"]))
    return salida


async def _continuidad(plano: dict, reparto: list[dict]) -> list[dict]:
    """Por cada elemento del plano: rasgos fijos, variables que aplican aquí y
    referencias que se enviarán al producir (§7.7b)."""
    por_id = {r["id"]: r for r in reparto}
    aplican = (plano.get("direccion") or {}).get("vestuario_y_variables") or {}
    salida = []
    for rid in plano.get("elementos") or []:
        r = por_id.get(rid)
        if not r:
            continue
        ficha = r.get("ficha") or {}
        salida.append(
            {
                "reparto_id": rid,
                "elemento_id": r["elemento_id"],
                "nombre": r["elemento"]["nombre"],
                "clase": r["elemento"]["clase"],
                "version": r["version_ficha"],
                "ficha_aprobada": ficha.get("estado") == "aprobada",
                "rasgos_fijos": ficha.get("rasgos_fijos") or [],
                "rasgos_variables": ficha.get("rasgos_variables") or [],
                "rasgos_variables_aplican": aplican.get(rid) or [],
                "referencias": ficha.get("referencias") or [],
            }
        )
    return salida


def _minus(valor: str | None) -> str:
    return (valor[0].lower() + valor[1:]) if valor else ""


def _segundos(valor: float) -> str:
    return f"{valor:g}".replace(".", ",") + " s"


def _par(encuadre: str | None, angulo: str | None) -> str:
    if encuadre and angulo:
        return f"{encuadre}, {_minus(angulo)}"
    return encuadre or _minus(angulo)


def _resumen_direccion(plano: dict) -> str:
    """«Plano medio, a la altura de los ojos → Detalle, picado · travelling adelante · 2,5 s» (§7.7c)."""
    d = plano.get("direccion") or {}
    partes: list[str] = []
    if plano.get("modalidad") == "video":
        inicio = _par(d.get("encuadre_inicio"), d.get("angulo_inicio"))
        final = _par(d.get("encuadre_final"), d.get("angulo_final"))
        base = f"{inicio} → {final}" if inicio and final else (inicio or final)
    else:
        base = _par(d.get("encuadre"), d.get("angulo"))
    if base:
        partes.append(base)
    if d.get("movimiento_camara"):
        partes.append(_minus(d["movimiento_camara"]))
    if plano.get("duracion_s"):
        partes.append(_segundos(plano["duracion_s"]))
    return " · ".join(partes)


async def _avisos_encadenado(escena_id: str, antes: list[str]) -> list[dict]:
    """§13: si un plano encadenado se queda sin anterior o cambia de anterior, se avisa
    y lo decide el usuario. Aquí no se cambia nada."""
    despues = [p["id"] for p in await _planos_de_escena(escena_id)]
    previo_antes = {pid: (antes[i - 1] if i > 0 else None) for i, pid in enumerate(antes)}
    avisos = []
    for i, pid in enumerate(despues):
        doc = await db.planos.find_one({"_id": pid})
        if not doc or not doc.get("plano_anterior_encadenado"):
            continue
        anterior = despues[i - 1] if i > 0 else None
        if anterior == previo_antes.get(pid):
            continue
        avisos.append(
            {
                "plano_id": pid,
                "es_primero": anterior is None,
                "anterior_antes": previo_antes.get(pid),
                "anterior_ahora": anterior,
            }
        )
    return avisos


async def _vista_plano(plano: dict, reparto: list[dict]) -> dict:
    pendientes = [c for c in plano.get("correcciones") or [] if c["estado"] == "pendiente"]
    return {
        **plano,
        "resumen_direccion": _resumen_direccion(plano),
        "correcciones_pendientes": len(pendientes),
        "encadenado_sin_anterior": bool(plano.get("plano_anterior_encadenado"))
        and plano.get("orden") == 0,
        "continuidad": await _continuidad(plano, reparto),
    }


# --- lienzo de una pieza -----------------------------------------------------


@router.get("/piezas/{pieza_id}/lienzo")
async def lienzo_de_pieza(pieza_id: str):
    pieza = await _pieza(pieza_id)
    guion = await _guion_de(pieza_id)
    proy = await db.proyectos.find_one({"_id": pieza["proyecto_id"]})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    reparto = await _reparto_con_ficha(pieza["proyecto_id"])

    aprobadas = await db.escenas.find(
        {"guion_id": guion["id"], "borrador": False}
    ).sort("orden", 1).to_list(500)
    escenas = []
    ids_escena = []
    for e in aprobadas:
        esc = sin_id(e)
        ids_escena.append(esc["id"])
        planos = await _planos_de_escena(esc["id"])
        escenas.append(
            {
                "escena": esc,
                "planos": [await _vista_plano(p, reparto) for p in planos],
            }
        )

    huerfanos = await db.planos.find(
        {"pieza_id": pieza_id, "escena_id": {"$nin": ids_escena}}
    ).sort("orden", 1).to_list(500)

    layout = await db.lienzos.find_one({"_id": pieza["proyecto_id"]})
    return {
        "pieza": pieza,
        "guion": guion,
        "escenas": escenas,
        "planos_sin_escena": [await _vista_plano(sin_id(p), reparto) for p in huerfanos],
        "reparto": reparto,
        "layout": sin_id(layout) if layout else LayoutLienzo().model_dump(),
    }


@router.get("/direccion/opciones")
async def opciones_direccion():
    return _OPCIONES


@router.get("/proyectos/{proyecto_id}/lienzo")
async def obtener_layout(proyecto_id: str):
    doc = await db.lienzos.find_one({"_id": proyecto_id})
    return sin_id(doc) if doc else LayoutLienzo().model_dump()


@router.put("/proyectos/{proyecto_id}/lienzo")
async def guardar_layout(proyecto_id: str, datos: LayoutLienzo):
    proy = await db.proyectos.find_one({"_id": proyecto_id})
    if not proy:
        raise HTTPException(404, "Proyecto no encontrado")
    doc = datos.model_dump(mode="json")
    doc["updated_at"] = ahora()
    doc["_id"] = proyecto_id
    await db.lienzos.replace_one({"_id": proyecto_id}, doc, upsert=True)
    return sin_id(doc)


# --- planos ------------------------------------------------------------------


@router.post("/escenas/{escena_id}/planos", status_code=201)
async def crear_plano(escena_id: str, datos: PlanoCrear):
    escena = await db.escenas.find_one({"_id": escena_id})
    if not escena:
        raise HTTPException(404, "Escena no encontrada")
    if escena["borrador"]:
        raise HTTPException(409, "Los planos se crean sobre las escenas del guion aprobado.")
    guion = await db.guiones.find_one({"_id": escena["guion_id"]})
    pieza_id = guion["pieza_id"]
    proy_id = (await db.piezas.find_one({"_id": pieza_id}))["proyecto_id"]
    proy = await db.proyectos.find_one({"_id": proy_id})
    planos = await _planos_de_escena(escena_id)
    plano = Plano(
        pieza_id=pieza_id,
        escena_id=escena_id,
        orden=len(planos),
        que_se_muestra=datos.que_se_muestra or "",
        modalidad=datos.modalidad or ("imagen" if proy["tipo"] == "imagen" else "video"),
        elementos=list(escena.get("elementos") or []),
    )
    doc = plano.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.planos.insert_one(doc)
    reparto = await _reparto_con_ficha(proy_id)
    return await _vista_plano(sin_id(doc), reparto)


@router.patch("/planos/{plano_id}")
async def editar_plano(plano_id: str, datos: PlanoEditar):
    plano = await _plano(plano_id)
    if plano["updated_at"] != datos.updated_at:
        raise HTTPException(409, "El plano se ha modificado en otro sitio. Recarga o sobrescribe.")
    cambios = {
        k: v for k, v in datos.model_dump(mode="json", exclude={"updated_at"}).items() if v is not None
    }
    # Cambiar de modalidad no pierde nada (§8): se copian los campos que pasan a
    # mandar y los que dejan de verse se guardan igual.
    nueva = cambios.get("modalidad")
    if nueva and nueva != plano["modalidad"]:
        d = dict(cambios.get("direccion") or plano.get("direccion") or {})
        if nueva == "video":
            d["encuadre_inicio"] = d.get("encuadre_inicio") or d.get("encuadre")
            d["angulo_inicio"] = d.get("angulo_inicio") or d.get("angulo")
            d["encuadre_final"] = d.get("encuadre_final") or d["encuadre_inicio"]
            d["angulo_final"] = d.get("angulo_final") or d["angulo_inicio"]
        else:
            d["encuadre"] = d.get("encuadre_inicio") or d.get("encuadre")
            d["angulo"] = d.get("angulo_inicio") or d.get("angulo")
        cambios["direccion"] = d
    cambios["updated_at"] = ahora()
    if cambios.get("plano_anterior_encadenado") and plano["orden"] == 0:
        raise HTTPException(409, "Un plano en primera posición no puede estar encadenado con el anterior.")
    await db.planos.update_one({"_id": plano_id}, {"$set": cambios})
    actualizado = await _plano(plano_id)
    proy_id = (await db.piezas.find_one({"_id": actualizado["pieza_id"]}))["proyecto_id"]
    return await _vista_plano(actualizado, await _reparto_con_ficha(proy_id))


@router.delete("/planos/{plano_id}")
async def borrar_plano(plano_id: str):
    plano = await _plano(plano_id)
    antes = (
        [p["id"] for p in await _planos_de_escena(plano["escena_id"])]
        if plano.get("escena_id")
        else []
    )
    await db.planos.delete_one({"_id": plano_id})
    avisos: list[dict] = []
    if plano.get("escena_id"):
        await _renumerar(plano["escena_id"])
        avisos = await _avisos_encadenado(plano["escena_id"], [p for p in antes if p != plano_id])
    return {"ok": True, "avisos_encadenado": avisos}


@router.post("/planos/{plano_id}/mover")
async def mover_plano(plano_id: str, datos: MoverPlano):
    plano = await _plano(plano_id)
    if not plano.get("escena_id"):
        raise HTTPException(409, "Este plano no está en una escena.")
    planos = await _renumerar(plano["escena_id"])
    ids = [p["id"] for p in planos]
    desde = ids.index(plano_id)
    if datos.a is not None:
        hasta = max(0, min(len(ids) - 1, datos.a))
    elif datos.direccion == "antes":
        hasta = max(0, desde - 1)
    elif datos.direccion == "despues":
        hasta = min(len(ids) - 1, desde + 1)
    else:
        raise HTTPException(422, "Indica «antes», «despues» o una posición.")
    ids.insert(hasta, ids.pop(desde))
    momento = ahora()
    for i, pid in enumerate(ids):
        await db.planos.update_one({"_id": pid}, {"$set": {"orden": i, "updated_at": momento}})
    return {
        "ok": True,
        "orden": ids,
        "avisos_encadenado": await _avisos_encadenado(plano["escena_id"], [p["id"] for p in planos]),
    }


@router.post("/planos/{plano_id}/duplicar", status_code=201)
async def duplicar_plano(plano_id: str):
    plano = await _plano(plano_id)
    planos = await _planos_de_escena(plano["escena_id"]) if plano.get("escena_id") else []
    copia = dict(plano)
    nuevo = Plano(
        pieza_id=plano["pieza_id"],
        escena_id=plano.get("escena_id"),
        orden=plano["orden"] + 1,
        que_se_muestra=copia["que_se_muestra"],
        modalidad=copia["modalidad"],
        duracion_s=copia.get("duracion_s"),
        elementos=list(copia.get("elementos") or []),
        direccion=copia.get("direccion") or {},
        plano_anterior_encadenado=copia.get("plano_anterior_encadenado", False),
    )
    doc = nuevo.model_dump(mode="json")
    doc["_id"] = doc["id"]
    momento = ahora()
    for p in planos:
        if p["orden"] > plano["orden"]:
            await db.planos.update_one(
                {"_id": p["id"]}, {"$set": {"orden": p["orden"] + 1, "updated_at": momento}}
            )
    await db.planos.insert_one(doc)
    proy_id = (await db.piezas.find_one({"_id": plano["pieza_id"]}))["proyecto_id"]
    return await _vista_plano(sin_id(doc), await _reparto_con_ficha(proy_id))


@router.post("/planos/{plano_id}/dividir", status_code=201)
async def dividir_plano(plano_id: str):
    """Crea un plano nuevo justo detrás: misma dirección y elementos, duración
    partida a la mitad, «qué se muestra» vacío, encadenado con el anterior y, en
    vídeo, con el inicio igual al final del original (§7.7)."""
    plano = await _plano(plano_id)
    if not plano.get("escena_id"):
        raise HTTPException(409, "Este plano no está en una escena.")
    planos = await _planos_de_escena(plano["escena_id"])
    d = dict(plano.get("direccion") or {})
    if plano["modalidad"] == "video":
        d = {
            **d,
            "encuadre_inicio": d.get("encuadre_final") or d.get("encuadre_inicio"),
            "angulo_inicio": d.get("angulo_final") or d.get("angulo_inicio"),
            "encuadre_final": None,
            "angulo_final": None,
        }
    mitad = (plano.get("duracion_s") / 2) if plano.get("duracion_s") else None
    nuevo = Plano(
        pieza_id=plano["pieza_id"],
        escena_id=plano["escena_id"],
        orden=plano["orden"] + 1,
        que_se_muestra="",
        modalidad=plano["modalidad"],
        duracion_s=mitad,
        elementos=list(plano.get("elementos") or []),
        direccion=d,
        plano_anterior_encadenado=True,
    )
    doc = nuevo.model_dump(mode="json")
    doc["_id"] = doc["id"]
    momento = ahora()
    for p in planos:
        if p["orden"] > plano["orden"]:
            await db.planos.update_one(
                {"_id": p["id"]}, {"$set": {"orden": p["orden"] + 1, "updated_at": momento}}
            )
    if mitad:
        await db.planos.update_one(
            {"_id": plano_id}, {"$set": {"duracion_s": mitad, "updated_at": momento}}
        )
    await db.planos.insert_one(doc)
    proy_id = (await db.piezas.find_one({"_id": plano["pieza_id"]}))["proyecto_id"]
    vista = await _vista_plano(sin_id(doc), await _reparto_con_ficha(proy_id))
    vista["avisos_encadenado"] = await _avisos_encadenado(
        plano["escena_id"], [p["id"] for p in planos]
    )
    return vista


# --- correcciones (§7.7d) ----------------------------------------------------


@router.post("/planos/{plano_id}/correcciones", status_code=201)
async def crear_correccion(plano_id: str, datos: CorreccionCrear):
    plano = await _plano(plano_id)
    texto = datos.texto.strip()
    if not texto:
        raise HTTPException(422, "Escribe qué hay que corregir.")
    correccion = Correccion(texto=texto)
    await db.planos.update_one(
        {"_id": plano_id},
        {
            "$push": {"correcciones": correccion.model_dump(mode="json")},
            "$set": {"updated_at": ahora()},
        },
    )
    proy_id = (await db.piezas.find_one({"_id": plano["pieza_id"]}))["proyecto_id"]
    return await _vista_plano(await _plano(plano_id), await _reparto_con_ficha(proy_id))


@router.patch("/planos/{plano_id}/correcciones/{correccion_id}")
async def editar_correccion(plano_id: str, correccion_id: str, datos: CorreccionEditar):
    plano = await _plano(plano_id)
    if datos.estado not in ("pendiente", "hecha"):
        raise HTTPException(422, "Estado no válido.")
    correcciones = []
    encontrada = False
    for c in plano.get("correcciones") or []:
        if c["id"] == correccion_id:
            encontrada = True
            c = {
                **c,
                "estado": datos.estado,
                "hecha_en": ahora() if datos.estado == "hecha" else None,
            }
        correcciones.append(c)
    if not encontrada:
        raise HTTPException(404, "Corrección no encontrada")
    await db.planos.update_one(
        {"_id": plano_id}, {"$set": {"correcciones": correcciones, "updated_at": ahora()}}
    )
    proy_id = (await db.piezas.find_one({"_id": plano["pieza_id"]}))["proyecto_id"]
    return await _vista_plano(await _plano(plano_id), await _reparto_con_ficha(proy_id))


@router.delete("/planos/{plano_id}/correcciones/{correccion_id}")
async def borrar_correccion(plano_id: str, correccion_id: str):
    plano = await _plano(plano_id)
    actual = next((c for c in plano.get("correcciones") or [] if c["id"] == correccion_id), None)
    if not actual:
        raise HTTPException(404, "Corrección no encontrada")
    if actual["estado"] != "pendiente":
        raise HTTPException(409, "Las correcciones hechas se quedan en el historial.")
    await db.planos.update_one(
        {"_id": plano_id},
        {"$pull": {"correcciones": {"id": correccion_id}}, "$set": {"updated_at": ahora()}},
    )
    proy_id = (await db.piezas.find_one({"_id": plano["pieza_id"]}))["proyecto_id"]
    return await _vista_plano(await _plano(plano_id), await _reparto_con_ficha(proy_id))


# --- vista previa del prompt (§8) -------------------------------------------


async def _prompt(plano: dict) -> dict:
    pieza = await db.piezas.find_one({"_id": plano["pieza_id"]})
    reparto = await _reparto_con_ficha(pieza["proyecto_id"])
    continuidad = await _continuidad(plano, reparto)
    desarrollo = await db.desarrollos.find_one({"_id": pieza["proyecto_id"]})
    automatico = constructor_prompt.construir(plano, continuidad, sin_id(desarrollo))
    return {
        "texto": plano.get("prompt_manual") if plano.get("prompt_editado_a_mano") else automatico,
        "automatico": automatico,
        "editado_a_mano": bool(plano.get("prompt_editado_a_mano")),
        "fichas_usadas": [
            {
                "nombre": c["nombre"],
                "version": c["version"],
                "aprobada": c["ficha_aprobada"],
            }
            for c in continuidad
        ],
    }


@router.get("/planos/{plano_id}/prompt")
async def ver_prompt(plano_id: str):
    return await _prompt(await _plano(plano_id))


@router.put("/planos/{plano_id}/prompt")
async def editar_prompt(plano_id: str, datos: PromptManual):
    await _plano(plano_id)
    await db.planos.update_one(
        {"_id": plano_id},
        {
            "$set": {
                "prompt_manual": datos.texto,
                "prompt_editado_a_mano": True,
                "updated_at": ahora(),
            }
        },
    )
    return await _prompt(await _plano(plano_id))


@router.post("/planos/{plano_id}/prompt/reconstruir")
async def reconstruir_prompt(plano_id: str):
    await _plano(plano_id)
    await db.planos.update_one(
        {"_id": plano_id},
        {
            "$set": {
                "prompt_manual": None,
                "prompt_editado_a_mano": False,
                "updated_at": ahora(),
            }
        },
    )
    return await _prompt(await _plano(plano_id))
