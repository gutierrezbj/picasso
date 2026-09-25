from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ajustes, asistente, desarrollo, espacios, estudio, formatos, proyectos

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


@app.get("/api/salud")
async def salud():
    return {"estado": "ok"}
