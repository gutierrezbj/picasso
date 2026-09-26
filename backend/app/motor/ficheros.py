"""Ficheros simulados de verdad, hechos con ffmpeg (§15.1).

Nada de placeholders vacíos: un PNG, un MP4 H.264 o un WAV reales, marcados
«SIMULADO», con el plano, la acción, el encuadre y el ángulo pedidos, el número
de variante y —si llegaron referencias— sus miniaturas en una esquina, para que
se vea que llegaron. En vídeo, contador de fotogramas y timecode.

Formatos variados a propósito (los fija el catálogo): 24 o 30 fps, resoluciones
distintas, audio a 44,1 o a 48 kHz. Siempre en la relación de aspecto pedida.
Todo determinista: la misma semilla da el mismo fichero.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

FUENTE = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FUENTE_MONO = "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"

RELACIONES: dict[str, tuple[int, int]] = {
    "16:9": (16, 9),
    "9:16": (9, 16),
    "1:1": (1, 1),
    "4:5": (4, 5),
}

FONDOS = ["0x1d2b2a", "0x2b1d2a", "0x2a291d", "0x1d222b", "0x2b241d", "0x22202b"]


@dataclass
class Encargo:
    clase: str  # imagen | video | audio
    relacion: str = "16:9"
    duracion_s: float = 3.0
    fps: int = 25
    lado_largo: int = 1280
    hz: int = 48000
    rotulos: list[str] = field(default_factory=list)
    referencias: list[str] = field(default_factory=list)
    imagen_base: str | None = None
    audio: str | None = None
    semilla: str = ""


def medidas(relacion: str, lado_largo: int) -> tuple[int, int]:
    ancho_r, alto_r = RELACIONES.get(relacion or "16:9", (16, 9))
    if ancho_r >= alto_r:
        ancho, alto = lado_largo, round(lado_largo * alto_r / ancho_r)
    else:
        alto, ancho = lado_largo, round(lado_largo * ancho_r / alto_r)
    return ancho - ancho % 2, alto - alto % 2


def _limpio(texto: str) -> str:
    sin_raros = re.sub(r"[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ ·.,\-/×()+→]", " ", texto or "")
    return re.sub(r"\s+", " ", sin_raros).strip()[:110]


def _fondo(semilla: str) -> str:
    n = int(hashlib.sha256(semilla.encode("utf-8")).hexdigest()[:8], 16)
    return FONDOS[n % len(FONDOS)]


def _texto(
    contenido: str,
    *,
    y: str,
    tamano: int,
    fuente: str = FUENTE,
    color: str = "white",
    caja: bool = False,
    crudo: bool = False,
) -> str:
    valor = contenido if crudo else _limpio(contenido)
    partes = [
        f"drawtext=fontfile={fuente}",
        f"text='{valor}'",
        "x=(w-text_w)/2",
        f"y={y}",
        f"fontsize={tamano}",
        f"fontcolor={color}",
        "shadowcolor=black@0.7",
        "shadowx=2",
        "shadowy=2",
    ]
    if caja:
        partes += ["box=1", "boxcolor=black@0.45", "boxborderw=18"]
    return ":".join(partes)


def _ejecutar(orden: list[str]) -> None:
    resultado = subprocess.run(orden, capture_output=True, check=False)
    if resultado.returncode != 0:
        detalle = resultado.stderr.decode("utf-8", "ignore")[-400:]
        raise RuntimeError(f"ffmpeg ha fallado: {detalle}")


def duracion_de(ruta: str | Path) -> float | None:
    salida = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "json", str(ruta),
        ],
        capture_output=True,
        check=False,
    )
    datos = json.loads(salida.stdout.decode("utf-8", "ignore") or "{}")
    valor = (datos.get("format") or {}).get("duration")
    return round(float(valor), 3) if valor else None


def _filtros_visuales(encargo: Encargo, ancho: int, alto: int) -> tuple[str, str]:
    """Cadena de filtro completa y nombre de la etiqueta de salida."""
    trozos: list[str] = [
        f"[0:v]scale={ancho}:{alto}:force_original_aspect_ratio=increase,"
        f"crop={ancho}:{alto},setsar=1[v0]"
    ]
    miniatura = max(96, ancho // 9)
    previa = "v0"
    for i, _ in enumerate(encargo.referencias):
        trozos.append(f"[{i + 1}:v]scale={miniatura}:-1[r{i}]")
        x = 16 + i * (miniatura + 12)
        trozos.append(f"[{previa}][r{i}]overlay=x=W-w-{x}:y=H-h-16[v{i + 1}]")
        previa = f"v{i + 1}"

    lineas: list[str] = [
        _texto("SIMULADO", y="h*0.30", tamano=max(48, ancho // 12), caja=True),
    ]
    if encargo.referencias:
        lineas.append(
            _texto(
                f"{len(encargo.referencias)} referencias recibidas",
                y="h*0.44",
                tamano=max(15, ancho // 52),
                fuente=FUENTE_MONO,
                color="0x8fe3d8",
            )
        )
    alto_linea = max(22, ancho // 40)
    for i, rotulo in enumerate(encargo.rotulos):
        lineas.append(
            _texto(
                rotulo,
                y=f"h*0.50+{i * alto_linea}",
                tamano=max(15, ancho // 46),
                fuente=FUENTE_MONO,
                color="0xd8e4e2" if i == 0 else "0xb9c6c4",
            )
        )
    if encargo.clase == "video":
        base = 0.50 + len(encargo.rotulos) * (alto_linea / max(alto, 1))
        lineas.append(
            _texto(
                "fotograma %{frame_num} de " + str(int(encargo.duracion_s * encargo.fps)),
                y=f"h*{base:.3f}+{alto_linea}",
                tamano=max(16, ancho // 42),
                fuente=FUENTE_MONO,
                color="0x8fe3d8",
                crudo=True,
            )
        )
        lineas.append(
            _texto(
                "%{pts\\:hms}",
                y=f"h*{base:.3f}+{alto_linea * 2}",
                tamano=max(16, ancho // 42),
                fuente=FUENTE_MONO,
                color="0x8fe3d8",
                crudo=True,
            )
        )
    trozos.append(f"[{previa}]" + ",".join(lineas) + "[salida]")
    return ";".join(trozos), "[salida]"


def _entradas_visuales(encargo: Encargo, ancho: int, alto: int) -> list[str]:
    orden: list[str] = []
    if encargo.imagen_base and encargo.clase == "video":
        # Imagen fija como base de un vídeo: se repite hasta la duración pedida.
        orden += [
            "-loop", "1", "-framerate", str(encargo.fps),
            "-t", f"{encargo.duracion_s}", "-i", encargo.imagen_base,
        ]
    elif encargo.imagen_base:
        orden += ["-i", encargo.imagen_base]
    elif encargo.clase == "video":
        orden += [
            "-f", "lavfi",
            "-i", f"color=c={_fondo(encargo.semilla)}:s={ancho}x{alto}"
                  f":r={encargo.fps}:d={encargo.duracion_s}",
        ]
    else:
        orden += ["-f", "lavfi", "-i", f"color=c={_fondo(encargo.semilla)}:s={ancho}x{alto}"]
    for ref in encargo.referencias:
        orden += ["-i", ref]
    return orden


def generar(carpeta: Path, nombre: str, encargo: Encargo) -> Path:
    carpeta.mkdir(parents=True, exist_ok=True)
    if encargo.clase == "audio":
        destino = carpeta / f"{nombre}.wav"
        _ejecutar(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi",
                "-i", f"sine=frequency={_tono(encargo.semilla)}:duration={encargo.duracion_s}",
                "-ar", str(encargo.hz), "-ac", "1", "-c:a", "pcm_s16le",
                str(destino),
            ]
        )
        return destino

    ancho, alto = medidas(encargo.relacion, encargo.lado_largo)
    filtro, salida = _filtros_visuales(encargo, ancho, alto)
    orden = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    orden += _entradas_visuales(encargo, ancho, alto)
    indice_audio = 1 + len(encargo.referencias)
    if encargo.clase == "video" and encargo.audio:
        orden += ["-i", encargo.audio]
    orden += ["-filter_complex", filtro, "-map", salida]

    if encargo.clase == "video":
        destino = carpeta / f"{nombre}.mp4"
        if encargo.audio:
            orden += ["-map", f"{indice_audio}:a", "-c:a", "aac", "-ar", str(encargo.hz)]
        orden += [
            "-t", f"{encargo.duracion_s}",
            "-r", str(encargo.fps),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast",
            "-movflags", "+faststart",
        ]
    else:
        destino = carpeta / f"{nombre}.png"
        orden += ["-frames:v", "1"]
    orden.append(str(destino))
    _ejecutar(orden)
    return destino


def _tono(semilla: str) -> int:
    return 220 + (int(hashlib.sha256(semilla.encode("utf-8")).hexdigest()[:4], 16) % 8) * 40


async def generar_async(carpeta: Path, nombre: str, encargo: Encargo) -> Path:
    return await asyncio.to_thread(generar, carpeta, nombre, encargo)


def ultimo_fotograma(origen: Path, destino: Path) -> None:
    """Último fotograma de un vídeo, para encadenar planos (§3.1, §15.1)."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    _ejecutar(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-sseof", "-0.2", "-i", str(origen),
            "-update", "1", "-frames:v", "1",
            str(destino),
        ]
    )
