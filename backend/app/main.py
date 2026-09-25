from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import config

from app.api import (
    ajustes,
    asistente,
    biblioteca,
    desarrollo,
    elementos,
    espacios,
    estudio,
    formatos,
    guiones,
    medios,
    piezas,
    proyectos,
    reparto,
)

app = FastAPI(title="studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(estudio.router)
app.include_router(espacios.router)
app.include_router(proyectos.router)
app.include_router(ajustes.router)
app.include_router(desarrollo.router)
app.include_router(formatos.router)
app.include_router(asistente.router)
app.include_router(medios.router)
app.include_router(elementos.router)
app.include_router(reparto.router)
app.include_router(biblioteca.router)
app.include_router(piezas.router)
app.include_router(guiones.router)


@app.get("/api/salud")
async def salud():
    return {"estado": "ok"}


@app.get("/api/entorno")
async def entorno():
    """Qué base de datos está usando esta instancia. Los tests y los scripts lo
    comprueban antes de escribir: solo escriben si es la base de pruebas."""
    nombre = config.DB_NAME
    return {"db_name": nombre, "es_pruebas": nombre == config.DB_NAME_PRUEBAS}
