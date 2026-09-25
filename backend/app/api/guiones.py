"""Guion (P6, §6.3). Las escenas del guion aprobado son intocables: editar un
guion aprobado crea una **revisión en curso**, que es una copia en borrador de
las escenas. Mientras exista, el guion aprobado sigue vigente.

Las filas de `escenas` con `borrador: True` son la copia de trabajo; con
`borrador: False`, las escenas del guion aprobado.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import db, sin_id
from app.dominio.modelos import (
    AprobarRevision,
    EncargoEditar,
    Escena,
    EscenaCrear,
    EscenaEditar,
    ahora,
)

router = APIRouter(prefix="/api", tags=["guion"])

CAMPOS_ESCENA = (
    "titulo",
    "que_ocurre",
    "que_se_ve",
    "intencion",
    "elementos",
    "dialogos",
    "sonido_previsto",
    "duracion_orientativa_s",
)

ETIQUETA_CAMPO = {
    "titulo": "Título",
    "que_ocurre": "Qué ocurre",
    "que_se_ve": "Qué se ve",
    "intencion": "Intención",
    "elementos": "Elementos",
    "dialogos": "Diálogos",
    "sonido_previsto": "Sonido previsto",
    "duracion_orientativa_s": "Duración orientativa",
    "que_se_muestra": "Qué se muestra",
    "composicion": "Composición",
    "referencias": "Referencias",
    "numero_imagenes": "Número de imágenes",
}

MARCAS = {"solo_texto", "afecta_planos"}


async def _guion_de_pieza(pieza_id: str) -> dict:
    doc = await db.guiones.find_one({"pieza_id": pieza_id})
    if not doc:
        raise HTTPException(404, "Guion no encontrado")
    return sin_id(doc)


async def _guion_por_id(guion_id: str) -> dict:
    doc = await db.guiones.find_one({"_id": guion_id})
    if not doc:
        raise HTTPException(404, "Guion no encontrado")
    return sin_id(doc)


async def _proyecto_de_guion(guion: dict) -> dict:
    pieza = await db.piezas.find_one({"_id": guion["pieza_id"]})
    proy = await db.proyectos.find_one({"_id": pieza["proyecto_id"]})
    return sin_id(proy)


async def _escenas(guion_id: str, borrador: bool) -> list[dict]:
    docs = await db.escenas.find({"guion_id": guion_id, "borrador": borrador}).sort("orden", 1).to_list(500)
    return [sin_id(d) for d in docs]


async def _activas(guion: dict) -> list[dict]:
    """Las escenas que se están editando o, si no hay revisión, las aprobadas."""
    if guion["estado"] == "borrador" or guion.get("revision_en_curso"):
        return await _escenas(guion["id"], True)
    return await _escenas(guion["id"], False)


async def _asegurar_trabajo(guion: dict) -> dict:
    """Antes de cualquier escritura: si el guion está aprobado y no hay revisión
    en curso, se crea copiando las escenas aprobadas (§6.3)."""
    if guion["estado"] == "borrador" or guion.get("revision_en_curso"):
        return guion
    aprobadas = await _escenas(guion["id"], False)
    copias = []
    for a in aprobadas:
        nueva = Escena(
            guion_id=guion["id"],
            orden=a["orden"],
            borrador=True,
            origen_id=a["id"],
            titulo=a["titulo"],
            que_ocurre=a["que_ocurre"],
            que_se_ve=a["que_se_ve"],
            intencion=a["intencion"],
            elementos=a["elementos"],
            dialogos=a["dialogos"],
            sonido_previsto=a.get("sonido_previsto"),
            duracion_orientativa_s=a.get("duracion_orientativa_s"),
        )
        doc = nueva.model_dump(mode="json")
        doc["_id"] = doc["id"]
        copias.append(doc)
    if copias:
        await db.escenas.insert_many(copias)
    momento = ahora()
    cambios = {"revision_en_curso": {"creada_en": momento}, "updated_at": momento}
    if guion["clase"] == "encargo":
        cambios["encargo_borrador"] = guion.get("encargo") or {
            "que_se_muestra": None,
            "composicion": None,
            "intencion": None,
            "elementos": [],
            "referencias": [],
            "numero_imagenes": 1,
        }
    await db.guiones.update_one({"_id": guion["id"]}, {"$set": cambios})
    return await _guion_por_id(guion["id"])


def _valor(e: dict, campo: str):
    """Un campo vacío y un campo sin escribir son lo mismo: si no se normaliza,
    el autoguardado convierte null en "" y aparecen diferencias fantasma."""
    v = e.get(campo)
    if v is None or v == "" or v == []:
        return None
    return v


def _diferencias(aprobadas: list[dict], trabajo: list[dict]) -> dict:
    ids_aprobadas = {a["id"]: a for a in aprobadas}
    referenciadas = {w["origen_id"] for w in trabajo if w.get("origen_id") in ids_aprobadas}

    anadidas = [
        {"escena_id": w["id"], "titulo": w["titulo"], "orden": w["orden"]}
        for w in trabajo
        if w.get("origen_id") not in ids_aprobadas
    ]
    eliminadas = [
        {"escena_id": a["id"], "titulo": a["titulo"], "orden": a["orden"]}
        for a in aprobadas
        if a["id"] not in referenciadas
    ]

    editadas = []
    for w in trabajo:
        a = ids_aprobadas.get(w.get("origen_id"))
        if not a:
            continue
        campos = []
        for campo in CAMPOS_ESCENA:
            if _valor(a, campo) != _valor(w, campo):
                campos.append(
                    {
                        "campo": campo,
                        "etiqueta": ETIQUETA_CAMPO[campo],
                        "antes": _valor(a, campo),
                        "despues": _valor(w, campo),
                    }
                )
        if campos:
            editadas.append({"escena_id": w["id"], "titulo": w["titulo"], "campos": campos})

    orden_antes = [a["id"] for a in aprobadas if a["id"] in referenciadas]
    orden_ahora = [w["origen_id"] for w in trabajo if w.get("origen_id") in referenciadas]
    reordenadas = []
    for i, oid in enumerate(orden_ahora):
        if orden_antes.index(oid) != i:
            a = ids_aprobadas[oid]
            reordenadas.append({"escena_id": oid, "titulo": a["titulo"], "de": orden_antes.index(oid) + 1, "a": i + 1})

    return {
        "anadidas": anadidas,
        "editadas": editadas,
        "eliminadas": eliminadas,
        "reordenadas": reordenadas,
        "hay_cambios": bool(anadidas or editadas or eliminadas or reordenadas),
    }


def _diferencias_encargo(aprobado: dict | None, borrador: dict | None) -> dict:
    campos = []
    a = aprobado or {}
    b = borrador or {}
    for campo in ("que_se_muestra", "composicion", "intencion", "elementos", "referencias", "numero_imagenes"):
        if _valor(a, campo) != _valor(b, campo):
            campos.append(
                {
                    "campo": campo,
                    "etiqueta": ETIQUETA_CAMPO[campo],
                    "antes": a.get(campo),
                    "despues": b.get(campo),
                }
            )
    return {"campos": campos, "hay_cambios": bool(campos)}


async def _personajes_del_proyecto(proyecto_id: str) -> dict[str, str]:
    """`id de entrada del reparto` → `elemento_id`, solo de clase personaje (§6.3)."""
    docs = await db.reparto.find({"proyecto_id": proyecto_id}).to_list(1000)
    elems = await db.elementos.find(
        {"_id": {"$in": [d["elemento_id"] for d in docs]}, "clase": "personaje"}
    ).to_list(1000)
    personajes = {e["_id"] for e in elems}
    return {d["_id"]: d["elemento_id"] for d in docs if d["elemento_id"] in personajes}


async def _falta_para_aprobar(guion: dict, escenas: list[dict]) -> list[str]:
    falta = []
    if guion["clase"] == "encargo":
        enc = (guion.get("encargo_borrador") if guion.get("revision_en_curso") else None) or guion.get(
            "encargo"
        ) or {}
        if not (enc.get("que_se_muestra") or "").strip():
            falta.append("escribe «qué se muestra»")
        if not enc.get("numero_imagenes"):
            falta.append("indica cuántas imágenes quieres")
        return falta
    if not escenas:
        falta.append("añade al menos una escena")
        return falta
    sin_titulo = [i + 1 for i, e in enumerate(escenas) if not (e["titulo"] or "").strip()]
    sin_que = [i + 1 for i, e in enumerate(escenas) if not (e["que_ocurre"] or "").strip()]
    if sin_titulo:
        falta.append(f"pon título a la escena {', '.join(map(str, sin_titulo))}")
    if sin_que:
        falta.append(f"escribe «qué ocurre» en la escena {', '.join(map(str, sin_que))}")

    proy = await _proyecto_de_guion(guion)
    personajes = await _personajes_del_proyecto(proy["id"])
    for i, e in enumerate(escenas):
        validos = {personajes[r] for r in (e.get("elementos") or []) if r in personajes}
        for j, d in enumerate(e.get("dialogos") or []):
            if d["hablante"] != "narrador" and d["hablante"] not in validos:
                falta.append(
                    f"corrige el diálogo {j + 1} de la escena {i + 1}: quien habla ya no está "
                    "en los elementos de la escena"
                )
    return falta


async def _respuesta(guion: dict) -> dict:
    activas = await _activas(guion)
    aprobadas = await _escenas(guion["id"], False)
    hay_revision = guion.get("revision_en_curso") is not None
    dif = _diferencias(aprobadas, activas) if hay_revision else None
    if hay_revision and guion["clase"] == "encargo":
        dif = {**(dif or {}), "encargo": _diferencias_encargo(guion.get("encargo"), guion.get("encargo_borrador"))}
    return {
        "guion": guion,
        "escenas": activas,
        "escenas_aprobadas": aprobadas,
        "encargo": (guion.get("encargo_borrador") if hay_revision else None) or guion.get("encargo"),
        "hay_revision_en_curso": hay_revision,
        "diferencias": dif,
        "falta_para_aprobar": await _falta_para_aprobar(guion, activas),
    }


@router.get("/piezas/{pieza_id}/guion")
async def obtener_guion(pieza_id: str):
    return await _respuesta(await _guion_de_pieza(pieza_id))


# --- Escenas ---


async def _ids_reparto(proyecto_id: str) -> tuple[set[str], set[str]]:
    docs = await db.reparto.find({"proyecto_id": proyecto_id}).to_list(1000)
    return {d["_id"] for d in docs}, {d["elemento_id"] for d in docs}


@router.post("/piezas/{pieza_id}/guion/escenas", status_code=201)
async def crear_escena(pieza_id: str, datos: EscenaCrear):
    guion = await _asegurar_trabajo(await _guion_de_pieza(pieza_id))
    if guion["clase"] == "encargo":
        raise HTTPException(409, "Un encargo de imagen no tiene escenas.")
    activas = await _activas(guion)
    escena = Escena(
        guion_id=guion["id"],
        orden=len(activas) + 1,
        borrador=True,
        titulo=(datos.titulo or "").strip(),
    )
    doc = escena.model_dump(mode="json")
    doc["_id"] = doc["id"]
    await db.escenas.insert_one(doc)
    return await _respuesta(await _guion_por_id(guion["id"]))


@router.get("/escenas/{escena_id}")
async def obtener_escena(escena_id: str):
    doc = await db.escenas.find_one({"_id": escena_id})
    if not doc:
        raise HTTPException(404, "Escena no encontrada")
    return sin_id(doc)


@router.patch("/escenas/{escena_id}")
async def editar_escena(escena_id: str, datos: EscenaEditar):
    doc = await db.escenas.find_one({"_id": escena_id})
    if not doc:
        raise HTTPException(404, "Escena no encontrada")
    escena = sin_id(doc)
    if not escena["borrador"]:
        raise HTTPException(409, "Esta escena pertenece al guion aprobado. Edita la revisión en curso.")
    if escena["updated_at"] != datos.updated_at:
        raise HTTPException(409, "La escena se ha modificado en otro sitio. Recarga o sobrescribe.")

    guion = await _guion_por_id(escena["guion_id"])
    proy = await _proyecto_de_guion(guion)
    ids_reparto, _ = await _ids_reparto(proy["id"])

    cambios = {k: v for k, v in datos.model_dump(mode="json", exclude={"updated_at"}).items() if v is not None}
    if "elementos" in cambios:
        fuera = [e for e in cambios["elementos"] if e not in ids_reparto]
        if fuera:
            raise HTTPException(409, "Una escena solo puede usar elementos del reparto del proyecto.")
    if "dialogos" in cambios:
        personajes = set((await _personajes_del_proyecto(proy["id"])).values())
        for d in cambios["dialogos"]:
            if d["hablante"] != "narrador" and d["hablante"] not in personajes:
                raise HTTPException(409, "Quien habla debe ser el narrador o un personaje del reparto.")
    cambios["updated_at"] = ahora()
    await db.escenas.update_one({"_id": escena_id}, {"$set": cambios})
    doc = await db.escenas.find_one({"_id": escena_id})
    return sin_id(doc)


async def _renumerar(guion_id: str) -> None:
    activas = await db.escenas.find({"guion_id": guion_id, "borrador": True}).sort("orden", 1).to_list(500)
    for i, e in enumerate(activas):
        if e["orden"] != i + 1:
            await db.escenas.update_one({"_id": e["_id"]}, {"$set": {"orden": i + 1}})


@router.delete("/escenas/{escena_id}", status_code=200)
async def borrar_escena(escena_id: str):
    doc = await db.escenas.find_one({"_id": escena_id})
    if not doc:
        raise HTTPException(404, "Escena no encontrada")
    escena = sin_id(doc)
    if not escena["borrador"]:
        raise HTTPException(409, "Esta escena pertenece al guion aprobado. Edita la revisión en curso.")
    await db.escenas.delete_one({"_id": escena_id})
    await _renumerar(escena["guion_id"])
    return await _respuesta(await _guion_por_id(escena["guion_id"]))


@router.post("/escenas/{escena_id}/mover")
async def mover_escena(escena_id: str, datos: dict):
    doc = await db.escenas.find_one({"_id": escena_id})
    if not doc:
        raise HTTPException(404, "Escena no encontrada")
    escena = sin_id(doc)
    if not escena["borrador"]:
        raise HTTPException(409, "Esta escena pertenece al guion aprobado. Edita la revisión en curso.")
    activas = await _escenas(escena["guion_id"], True)
    posicion = next(i for i, e in enumerate(activas) if e["id"] == escena_id)
    destino = datos.get("a")
    if destino is None:
        destino = posicion - 1 if datos.get("direccion") == "subir" else posicion + 1
    destino = max(0, min(len(activas) - 1, int(destino)))
    if destino != posicion:
        activas.insert(destino, activas.pop(posicion))
        momento = ahora()
        for i, e in enumerate(activas):
            await db.escenas.update_one(
                {"_id": e["id"]}, {"$set": {"orden": i + 1, "updated_at": momento}}
            )
    return await _respuesta(await _guion_por_id(escena["guion_id"]))


# --- Encargo de imagen ---


@router.put("/piezas/{pieza_id}/guion/encargo")
async def guardar_encargo(pieza_id: str, datos: EncargoEditar):
    guion = await _asegurar_trabajo(await _guion_de_pieza(pieza_id))
    if guion["clase"] != "encargo":
        raise HTTPException(409, "Este proyecto tiene guion de escenas, no encargo de imagen.")
    hay_revision = guion.get("revision_en_curso") is not None
    base = dict((guion.get("encargo_borrador") if hay_revision else guion.get("encargo")) or {})
    base.setdefault("elementos", [])
    base.setdefault("referencias", [])
    base.setdefault("numero_imagenes", 1)
    cambios = {k: v for k, v in datos.model_dump().items() if v is not None}
    if "elementos" in cambios:
        proy = await _proyecto_de_guion(guion)
        ids_reparto, _ = await _ids_reparto(proy["id"])
        if [e for e in cambios["elementos"] if e not in ids_reparto]:
            raise HTTPException(409, "El encargo solo puede usar elementos del reparto del proyecto.")
    base.update(cambios)
    campo = "encargo_borrador" if hay_revision else "encargo"
    await db.guiones.update_one({"_id": guion["id"]}, {"$set": {campo: base, "updated_at": ahora()}})
    return await _respuesta(await _guion_por_id(guion["id"]))


# --- Aprobación y revisiones ---


@router.post("/piezas/{pieza_id}/guion/aprobar")
async def aprobar_guion(pieza_id: str):
    guion = await _guion_de_pieza(pieza_id)
    if guion.get("revision_en_curso"):
        raise HTTPException(409, "Hay una revisión en curso: apruébala o descártala.")
    if guion["estado"] == "aprobado":
        return await _respuesta(guion)
    activas = await _activas(guion)
    falta = await _falta_para_aprobar(guion, activas)
    if falta:
        raise HTTPException(400, "Para aprobar, " + " y ".join(falta) + ".")
    momento = ahora()
    await db.escenas.update_many(
        {"guion_id": guion["id"], "borrador": True},
        {"$set": {"borrador": False, "origen_id": None, "updated_at": momento}},
    )
    await db.guiones.update_one(
        {"_id": guion["id"]},
        {"$set": {"estado": "aprobado", "aprobado_en": momento, "revision": 1, "updated_at": momento}},
    )
    return await _respuesta(await _guion_por_id(guion["id"]))


@router.post("/piezas/{pieza_id}/guion/revision")
async def crear_revision(pieza_id: str):
    """Editar un guion aprobado no lo desaprueba: abre una revisión en curso (§6.3)."""
    guion = await _guion_de_pieza(pieza_id)
    if guion["estado"] != "aprobado":
        raise HTTPException(409, "El guion todavía está en borrador: se edita directamente.")
    return await _respuesta(await _asegurar_trabajo(guion))


@router.get("/piezas/{pieza_id}/guion/diferencias")
async def diferencias_revision(pieza_id: str):
    guion = await _guion_de_pieza(pieza_id)
    if not guion.get("revision_en_curso"):
        raise HTTPException(409, "No hay ninguna revisión en curso.")
    respuesta = await _respuesta(guion)
    return respuesta["diferencias"]


@router.post("/piezas/{pieza_id}/guion/revision/aprobar")
async def aprobar_revision(pieza_id: str, datos: AprobarRevision):
    guion = await _guion_de_pieza(pieza_id)
    if not guion.get("revision_en_curso"):
        raise HTTPException(409, "No hay ninguna revisión en curso.")
    activas = await _activas(guion)
    falta = await _falta_para_aprobar(guion, activas)
    if falta:
        raise HTTPException(400, "Para aprobar la revisión, " + " y ".join(falta) + ".")

    aprobadas = await _escenas(guion["id"], False)
    dif = _diferencias(aprobadas, activas)
    if guion["clase"] == "encargo":
        dif_enc = _diferencias_encargo(guion.get("encargo"), guion.get("encargo_borrador"))
        if dif_enc["hay_cambios"] and datos.marcas.get("encargo") not in MARCAS:
            raise HTTPException(400, "Marca si el cambio del encargo es solo de texto o si afecta a las imágenes.")

    for e in dif["editadas"]:
        marca = datos.marcas.get(e["escena_id"])
        if marca not in MARCAS:
            raise HTTPException(
                400, f"Marca en «{e['titulo'] or 'Escena sin título'}» si es solo texto o si afecta a los planos."
            )

    momento = ahora()
    nuevas = []
    for i, w in enumerate(activas):
        nuevo_id = w.get("origen_id") or w["id"]
        nuevas.append(
            {
                "_id": nuevo_id,
                "id": nuevo_id,
                "guion_id": guion["id"],
                "orden": i + 1,
                "borrador": False,
                "origen_id": None,
                "titulo": w["titulo"],
                "que_ocurre": w["que_ocurre"],
                "que_se_ve": w["que_se_ve"],
                "intencion": w["intencion"],
                "elementos": w["elementos"],
                "dialogos": w["dialogos"],
                "sonido_previsto": w.get("sonido_previsto"),
                "duracion_orientativa_s": w.get("duracion_orientativa_s"),
                "created_at": w["created_at"],
                "updated_at": momento,
            }
        )
    await db.escenas.delete_many({"guion_id": guion["id"]})
    if nuevas:
        await db.escenas.insert_many(nuevas)

    resumen = {
        "anadidas": len(dif["anadidas"]),
        "editadas": len(dif["editadas"]),
        "eliminadas": len(dif["eliminadas"]),
        "reordenadas": len(dif["reordenadas"]),
    }
    cambios = {
        "revision": guion["revision"] + 1,
        "revision_en_curso": None,
        "aprobado_en": momento,
        "updated_at": momento,
    }
    if guion["clase"] == "encargo":
        cambios["encargo"] = guion.get("encargo_borrador")
        cambios["encargo_borrador"] = None
    await db.guiones.update_one(
        {"_id": guion["id"]},
        {
            "$set": cambios,
            "$push": {
                "historial_revisiones": {
                    "revision": guion["revision"] + 1,
                    "aprobada_en": momento,
                    "marcas": datos.marcas,
                    "resumen": resumen,
                }
            },
        },
    )
    return await _respuesta(await _guion_por_id(guion["id"]))


@router.post("/piezas/{pieza_id}/guion/revision/descartar")
async def descartar_revision(pieza_id: str):
    guion = await _guion_de_pieza(pieza_id)
    if not guion.get("revision_en_curso"):
        raise HTTPException(409, "No hay ninguna revisión en curso.")
    await db.escenas.delete_many({"guion_id": guion["id"], "borrador": True})
    await db.guiones.update_one(
        {"_id": guion["id"]},
        {"$set": {"revision_en_curso": None, "encargo_borrador": None, "updated_at": ahora()}},
    )
    return await _respuesta(await _guion_por_id(guion["id"]))
