"""Línea de tiempo FCPXML 1.9 para DaVinci Resolve (§11.3).

Todo se mide en fotogramas enteros del `fps` del proyecto: nada de segundos con
decimales en la línea de tiempo. El vídeo va en la pista principal (spine); cada
voz va enganchada debajo de su plano (lane -1), para moverse con él; la música
(lane -2) y el ambiente (lane -3) se enganchan al primer elemento de la pieza en
su posición absoluta.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

LANE_VOCES = -1
LANE_MUSICA = -2
LANE_AMBIENTE = -3


@dataclass
class ClipAudio:
    nombre: str
    ruta: str  # relativa a la carpeta del paquete
    duracion_f: int
    offset_f: int  # en el tiempo local del elemento al que se engancha
    lane: int
    canales: int = 1
    volumen_db: float = 0.0


@dataclass
class ElementoSpine:
    nombre: str
    duracion_f: int
    ruta: str | None = None  # None = hueco
    audios: list[ClipAudio] = field(default_factory=list)


def _t(frames: int, fps: int) -> str:
    return f"{frames}/{fps}s" if frames else "0s"


def _src(ruta: str, base_absoluta: str | None) -> str:
    if base_absoluta:
        completa = str(Path(base_absoluta) / ruta)
        return "file://" + quote(completa)
    return "./" + quote(ruta)


def construir(
    *,
    proyecto: str,
    fps: int,
    ancho: int,
    alto: int,
    elementos: list[ElementoSpine],
    base_absoluta: str | None = None,
) -> str:
    recursos: list[str] = [
        f'    <format id="r0" name="FFVideoFormat{ancho}x{alto}p{fps}" frameDuration="1/{fps}s" '
        f'width="{ancho}" height="{alto}" colorSpace="1-1-1 (Rec. 709)"/>'
    ]
    siguiente = 1

    def asset(nombre: str, ruta: str, duracion_f: int, video: bool, canales: int = 1) -> str:
        nonlocal siguiente
        rid = f"r{siguiente}"
        siguiente += 1
        if video:
            attrs = f'hasVideo="1" format="r0" videoSources="1"'
        else:
            attrs = f'hasAudio="1" audioSources="1" audioChannels="{canales}" audioRate="48000"'
        recursos.append(
            f'    <asset id="{rid}" name="{escape(nombre)}" start="0s" duration="{_t(duracion_f, fps)}" {attrs}>\n'
            f'      <media-rep kind="original-media" src="{escape(_src(ruta, base_absoluta))}"/>\n'
            f"    </asset>"
        )
        return rid

    spine: list[str] = []
    offset = 0
    for el in elementos:
        hijos: list[str] = []
        for a in el.audios:
            rid = asset(a.nombre, a.ruta, a.duracion_f, video=False, canales=a.canales)
            volumen = (
                f'\n          <adjust-volume amount="{a.volumen_db:g}dB"/>\n        '
                if a.volumen_db
                else ""
            )
            cierre = f">{volumen}</asset-clip>" if volumen else "/>"
            hijos.append(
                f'        <asset-clip ref="{rid}" lane="{a.lane}" offset="{_t(a.offset_f, fps)}" '
                f'name="{escape(a.nombre)}" start="0s" duration="{_t(a.duracion_f, fps)}"{cierre}'
            )
        cuerpo = ("\n" + "\n".join(hijos) + "\n      ") if hijos else ""
        if el.ruta:
            rid = asset(el.nombre, el.ruta, el.duracion_f, video=True)
            abre = (
                f'      <asset-clip ref="{rid}" offset="{_t(offset, fps)}" name="{escape(el.nombre)}" '
                f'start="0s" duration="{_t(el.duracion_f, fps)}" tcFormat="NDF"'
            )
            spine.append(abre + (f">{cuerpo}</asset-clip>" if hijos else "/>"))
        else:
            abre = (
                f'      <gap name="{escape(el.nombre)}" offset="{_t(offset, fps)}" start="0s" '
                f'duration="{_t(el.duracion_f, fps)}"'
            )
            spine.append(abre + (f">{cuerpo}</gap>" if hijos else "/>"))
        offset += el.duracion_f

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!DOCTYPE fcpxml>\n"
        '<fcpxml version="1.9">\n'
        "  <resources>\n" + "\n".join(recursos) + "\n  </resources>\n"
        "  <library>\n"
        f'    <event name="Picasso">\n'
        f'      <project name="{escape(proyecto)}">\n'
        f'        <sequence format="r0" duration="{_t(offset, fps)}" tcStart="0s" tcFormat="NDF" '
        'audioLayout="stereo" audioRate="48k">\n'
        "          <spine>\n" + "\n".join(spine) + "\n          </spine>\n"
        "        </sequence>\n"
        "      </project>\n"
        "    </event>\n"
        "  </library>\n"
        "</fcpxml>\n"
    )
