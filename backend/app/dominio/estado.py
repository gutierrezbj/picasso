"""Estado derivado (§3.2): qué pasos están «listos». No se guarda a mano.

Fase 4: el paso de Idea, los pasos de elementos (P5) y el Guion / Encargo de
imagen / Capítulos (P6). Los pasos de Lienzo y Montaje llegan en fases posteriores.
"""
from __future__ import annotations

from app.dominio import recorridos


def paso_idea_clave(tipo: str) -> str | None:
    for p in recorridos.RECORRIDOS[tipo]["pasos"]:
        if p["pantalla"] == "idea":
            return p["clave"]
    return None


async def _reparto_listo(db, proyecto_id: str) -> list[dict]:
    """Entradas del reparto cuya versión fijada está aprobada, con su ficha."""
    entradas = await db.reparto.find({"proyecto_id": proyecto_id}).to_list(1000)
    salida = []
    for e in entradas:
        el = await db.elementos.find_one({"_id": e["elemento_id"]})
        if not el:
            continue
        ficha = await db.fichas.find_one(
            {"elemento_id": e["elemento_id"], "version": e["version_ficha"]}
        )
        if not ficha or ficha["estado"] != "aprobada":
            continue
        salida.append({"clase": el["clase"], "ficha": ficha})
    return salida


async def completado_de(db, proyecto: dict) -> dict:
    """Mapa clave_paso -> bool."""
    completado: dict[str, bool] = {}

    des = await db.desarrollos.find_one({"_id": proyecto["id"]})
    if des and des.get("estado") == "listo":
        clave = paso_idea_clave(proyecto["tipo"])
        if clave:
            completado[clave] = True

    pasos = recorridos.RECORRIDOS[proyecto["tipo"]]["pasos"]
    if any(p["pantalla"] == "elementos" for p in pasos):
        aprobadas = await _reparto_listo(db, proyecto["id"])
        for p in pasos:
            if p["pantalla"] != "elementos":
                continue
            clase = p.get("clase")
            candidatas = [a for a in aprobadas if clase is None or a["clase"] == clase]
            if p.get("requiere_referencia"):
                candidatas = [a for a in candidatas if a["ficha"].get("referencias")]
            completado[p["clave"]] = bool(candidatas)

    if any(p["pantalla"] == "guion" for p in pasos):
        piezas = await db.piezas.find({"proyecto_id": proyecto["id"]}).to_list(500)
        ids = [p["_id"] for p in piezas]
        guiones = await db.guiones.find({"pieza_id": {"$in": ids}}).to_list(500)
        hay_aprobado = any(g["estado"] == "aprobado" for g in guiones)
        for p in pasos:
            if p["pantalla"] == "guion":
                completado[p["clave"]] = hay_aprobado

    # §4.1: el montaje está listo cuando hay un paquete de edición exportado.
    if any(p["pantalla"] == "montaje" for p in pasos):
        exportado = await db.exportaciones.find_one({"proyecto_id": proyecto["id"], "estado": "lista"})
        for p in pasos:
            if p["pantalla"] == "montaje":
                completado[p["clave"]] = bool(exportado)

    return completado
