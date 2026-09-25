# estado derivado: qué pasos están "listos" (Fase 2: solo el paso de Idea/Desarrollo)
from __future__ import annotations

from app.dominio import recorridos


def paso_idea_clave(tipo: str) -> str | None:
    for p in recorridos.RECORRIDOS[tipo]["pasos"]:
        if p["pantalla"] == "idea":
            return p["clave"]
    return None


async def completado_de(db, proyecto: dict) -> dict:
    """Mapa clave_paso -> bool. En Fase 2 solo se puede completar el paso de Idea."""
    completado = {}
    des = await db.desarrollos.find_one({"_id": proyecto["id"]})
    if des and des.get("estado") == "listo":
        clave = paso_idea_clave(proyecto["tipo"])
        if clave:
            completado[clave] = True
    return completado
