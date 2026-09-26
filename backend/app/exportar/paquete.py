"""Paquete de edición (§11.3): un ZIP ordenado por tipo de material, nunca un
cajón mezclado, listo para continuar en DaVinci Resolve o CapCut.

Todo se normaliza al formato del proyecto (fps, resolución, H.264 yuv420p; WAV
PCM 48 kHz) y se mide en fotogramas enteros. Antes de entregar el ZIP se
comprueba el paquete: si algo no cuadra, no se entrega y se dice qué falló.
"""
from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Optional
from xml.etree import ElementTree

from app.almacen import almacen
from app.api.montaje import linea_de_tiempo
from app.db import db
from app.exportar import fcpxml
from app.motor.ficheros import duracion_de

Progreso = Callable[[int, str], Awaitable[None]]

# §11.3: resolución de salida según la relación de aspecto del proyecto.
RESOLUCIONES = {"16:9": (1920, 1080), "9:16": (1080, 1920), "1:1": (1080, 1080), "4:5": (1080, 1350)}


class ErrorPaquete(Exception):
    pass


def slug(texto: str) -> str:
    """Sin espacios ni tildes, para que ordene igual en cualquier sistema."""
    plano = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    limpio = "".join(c.lower() if c.isalnum() else "-" for c in plano)
    while "--" in limpio:
        limpio = limpio.replace("--", "-")
    return limpio.strip("-") or "sin-nombre"


def _ffmpeg(orden: list[str]) -> None:
    r = subprocess.run(["ffmpeg", "-y", "-v", "error", *orden], capture_output=True, check=False)
    if r.returncode != 0:
        detalle = r.stderr.decode("utf-8", "ignore").strip().splitlines()[-3:]
        raise ErrorPaquete("ffmpeg ha fallado: " + " | ".join(detalle))


async def _medio(medio_id: str) -> tuple[Path, dict[str, Any]]:
    doc = await db.medios.find_one({"_id": medio_id})
    if not doc:
        raise ErrorPaquete(f"Falta el medio {medio_id} en la base de datos.")
    ruta = almacen.ruta_absoluta(doc["ruta"])
    if not Path(ruta).exists():
        raise ErrorPaquete(f"Falta el archivo de «{doc.get('nombre_original') or medio_id}» en el almacén.")
    return Path(ruta), doc


def _cadena_video(ancho: int, alto: int, fps: int) -> str:
    # Encaja sin recortar (bandas), ritmo del proyecto y alarga con el último
    # fotograma si la toma es más corta que el plano.
    return (
        f"scale={ancho}:{alto}:force_original_aspect_ratio=decrease,"
        f"pad={ancho}:{alto}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={fps},"
        "tpad=stop_mode=clone:stop=-1"
    )


def _normalizar_video(origen: Path, destino: Path, frames: int, ancho: int, alto: int, fps: int, imagen: bool) -> None:
    entrada = ["-loop", "1", "-i", str(origen)] if imagen else ["-i", str(origen)]
    _ffmpeg([
        *entrada, "-vf", _cadena_video(ancho, alto, fps), "-frames:v", str(frames),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-r", str(fps), "-an", str(destino),
    ])


def _clip_hueco(destino: Path, rotulo: str, frames: int, ancho: int, alto: int, fps: int) -> None:
    """Un plano sin toma sale como clip negro rotulado: así las voces de ese plano
    cuelgan de un clip real en el editor (un hueco vacío puede perderlas)."""
    from app.motor.ficheros import FUENTE

    texto = rotulo.replace(":", "\\:").replace("'", "")
    _ffmpeg([
        "-f", "lavfi", "-i", f"color=c=black:s={ancho}x{alto}:r={fps}",
        "-vf", f"drawtext=fontfile={FUENTE}:text='{texto}':fontcolor=white@0.8:fontsize={alto // 18}:"
               "x=(w-text_w)/2:y=(h-text_h)/2",
        "-frames:v", str(frames), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(fps), str(destino),
    ])


def _normalizar_audio(origen: Path, destino: Path, mono: bool) -> None:
    canales = ["-ac", "1"] if mono else []
    _ffmpeg(["-i", str(origen), "-vn", "-ar", "48000", *canales, "-c:a", "pcm_s16le", str(destino)])


def _canales(ruta: Path) -> int:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels",
         "-of", "default=nk=1:nw=1", str(ruta)],
        capture_output=True, check=False,
    )
    try:
        return int(r.stdout.decode().strip() or 1)
    except ValueError:
        return 1


def _frames(segundos: float, fps: int) -> int:
    return max(1, round(segundos * fps))


def _relacion_de(ruta: Path) -> Optional[float]:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(ruta)],
        capture_output=True, check=False,
    )
    try:
        w, h = r.stdout.decode().strip().split(",")[:2]
        return int(w) / int(h)
    except (ValueError, ZeroDivisionError):
        return None


async def _fichas(proyecto_id: str, destino: Path) -> list[dict[str, Any]]:
    """Una carpeta por elemento del reparto con su ficha y sus referencias."""
    salida: list[dict[str, Any]] = []
    for entrada in await db.reparto.find({"proyecto_id": proyecto_id}).to_list(500):
        elemento = await db.elementos.find_one({"_id": entrada["elemento_id"]})
        ficha = await db.fichas.find_one(
            {"elemento_id": entrada["elemento_id"], "version": entrada["version_ficha"]}
        )
        if not elemento or not ficha:
            continue
        carpeta = destino / f"{slug(elemento['nombre'])}_v{ficha['version']}"
        carpeta.mkdir(parents=True, exist_ok=True)
        lineas = [f"# {elemento['nombre']} · v{ficha['version']} ({elemento['clase']})", ""]
        if ficha.get("descripcion"):
            lineas += [ficha["descripcion"], ""]
        for titulo, clave in (("Rasgos fijos (no cambian nunca)", "rasgos_fijos"), ("Rasgos variables", "rasgos_variables")):
            if ficha.get(clave):
                lineas += [f"## {titulo}", *[f"- {r}" for r in ficha[clave]], ""]
        for titulo, clave in (
            ("Personalidad", "personalidad"), ("Materiales y colores", "materiales_colores"),
            ("Ambiente", "ambiente"), ("Distribución", "distribucion"),
        ):
            if ficha.get(clave):
                lineas += [f"## {titulo}", ficha[clave], ""]
        refs = []
        for i, ref in enumerate(ficha.get("referencias") or [], start=1):
            try:
                origen, medio = await _medio(ref["medio_id"])
            except ErrorPaquete:
                continue
            nombre = f"referencia_{i:02d}_{ref.get('rol') or 'otra'}{origen.suffix}"
            shutil.copy2(origen, carpeta / nombre)
            refs.append(nombre)
        if refs:
            lineas += ["## Referencias", *[f"- {r}" for r in refs], ""]
        (carpeta / "ficha.md").write_text("\n".join(lineas), encoding="utf-8")
        salida.append({"elemento": elemento["nombre"], "clase": elemento["clase"], "version": ficha["version"], "carpeta": carpeta.name})
    return salida


def _guion_md(escenas: list[dict[str, Any]], revision: int, nombres: dict[str, str]) -> str:
    lineas = [f"# Guion aprobado · revisión {revision}", ""]
    for n, e in enumerate(escenas, start=1):
        lineas += [f"## {n}. {e.get('titulo') or 'Escena'}", ""]
        for etiqueta, clave in (("Qué ocurre", "que_ocurre"), ("Qué se ve", "que_se_ve"), ("Intención", "intencion"), ("Sonido previsto", "sonido_previsto")):
            if e.get(clave):
                lineas += [f"**{etiqueta}:** {e[clave]}", ""]
        for d in e.get("dialogos") or []:
            quien = "Narrador" if d["hablante"] == "narrador" else nombres.get(d["hablante"], "?")
            lineas += [f"> **{quien}:** {d.get('texto') or ''}", ""]
    return "\n".join(lineas)


def _leeme(nombre: str, fps: int, ancho: int, alto: int, rutas: str, avisos: list[str]) -> str:
    lineas = [
        f"# {nombre}",
        "",
        f"Paquete de edición generado por Picasso. Formato: {ancho}×{alto} a {fps} fps, vídeo H.264,",
        "audio WAV PCM 48 kHz. Los clips de vídeo van sin sonido: las voces, la música y el ambiente",
        "van cada uno en su carpeta y en su pista.",
        "",
        "## DaVinci Resolve",
        "",
        "1. Descomprime el ZIP y no muevas nada de dentro de la carpeta.",
        "2. En DaVinci: Archivo → Importar → Línea de tiempo… y elige `timeline.fcpxml`.",
        f"3. Crea el proyecto a {fps} fps antes de importar (el formato de la secuencia va en el archivo).",
        "4. Si algún clip sale sin enlazar, usa «Reenlazar medios» y apunta a esta carpeta.",
        "",
        f"Rutas del archivo: {'relativas a esta carpeta' if rutas == 'relativas' else 'absolutas a la carpeta indicada al exportar'}.",
        "",
        "Pistas: vídeo arriba; debajo, voces (enganchadas a su plano), música y ambiente.",
        "El volumen de música y ambiente va como ajuste de la pista, no aplicado al archivo.",
        "",
        "## CapCut",
        "",
        "CapCut no importa la línea de tiempo: arrastra los clips de `video/` en orden (el nombre",
        "Exx_Pyy ya los ordena), las voces de `audio/voces/` y la música de `audio/musica/`.",
        "`previo.mp4` es la secuencia completa para ver cómo queda.",
        "",
    ]
    if avisos:
        lineas += ["## Avisos del montaje", "", *[f"- {a}" for a in avisos], ""]
    return "\n".join(lineas)


def _previo(carpeta: Path, clips: list[tuple[Optional[Path], int]], audios: list[tuple[Path, int, float]], fps: int, ancho: int, alto: int, total_f: int) -> None:
    """Concatenado rápido para ver: huecos en negro, voces y pistas mezcladas."""
    temporal = carpeta / ".previo"
    temporal.mkdir(exist_ok=True)
    lista = []
    for i, (ruta, frames) in enumerate(clips):
        if ruta is None:
            negro = temporal / f"hueco_{i:03d}.mp4"
            _ffmpeg([
                "-f", "lavfi", "-i", f"color=c=black:s={ancho}x{alto}:r={fps}", "-frames:v", str(frames),
                "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(negro),
            ])
            ruta = negro
        lista.append(f"file '{ruta.as_posix()}'")
    (temporal / "lista.txt").write_text("\n".join(lista), encoding="utf-8")
    solo_video = temporal / "video.mp4"
    _ffmpeg(["-f", "concat", "-safe", "0", "-i", str(temporal / "lista.txt"), "-c", "copy", str(solo_video)])
    total_s = total_f / fps
    if audios:
        entradas: list[str] = ["-i", str(solo_video)]
        filtros = []
        for i, (ruta, retardo_ms, volumen_db) in enumerate(audios, start=1):
            entradas += ["-i", str(ruta)]
            filtros.append(f"[{i}:a]volume={volumen_db}dB,adelay={retardo_ms}|{retardo_ms},aformat=channel_layouts=stereo[a{i}]")
        mezcla = "".join(f"[a{i}]" for i in range(1, len(audios) + 1))
        filtros.append(f"{mezcla}amix=inputs={len(audios)}:normalize=0:dropout_transition=0[mix]")
        _ffmpeg([
            *entradas, "-filter_complex", ";".join(filtros), "-map", "0:v", "-map", "[mix]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total_s:.3f}", str(carpeta / "previo.mp4"),
        ])
    else:
        shutil.copy2(solo_video, carpeta / "previo.mp4")
    shutil.rmtree(temporal, ignore_errors=True)


def _comprobar(carpeta: Path, manifiesto: dict[str, Any], fps: int) -> list[str]:
    """§11.3: que cada fichero exista y dure lo que dice el manifiesto (±1
    fotograma) y que la línea de tiempo sea XML válido y cuadre."""
    fallos: list[str] = []
    tolerancia = 1.0 / fps + 0.02
    for p in manifiesto["planos"]:
        if not p.get("archivo"):
            continue
        ruta = carpeta / p["archivo"]
        if not ruta.exists():
            fallos.append(f"Falta {p['archivo']}.")
            continue
        real = duracion_de(ruta) or 0
        if abs(real - p["frames"] / fps) > tolerancia:
            fallos.append(f"{p['archivo']} dura {real:.3f} s y debería durar {p['frames'] / fps:.3f} s.")
    for v in manifiesto["voces"]:
        if not (carpeta / v["archivo"]).exists():
            fallos.append(f"Falta {v['archivo']}.")
    for pista in manifiesto["pistas"]:
        if not (carpeta / pista["archivo"]).exists():
            fallos.append(f"Falta {pista['archivo']}.")
    for fijo in ("timeline.fcpxml", "previo.mp4", "guion.md", "LEEME.md"):
        if not (carpeta / fijo).exists():
            fallos.append(f"Falta {fijo}.")
    try:
        raiz = ElementTree.parse(carpeta / "timeline.fcpxml").getroot()
        secuencia = raiz.find(".//sequence")
        duracion = secuencia.get("duration") if secuencia is not None else None
        esperado = f"{manifiesto['duracion_frames']}/{fps}s"
        if duracion != esperado:
            fallos.append(f"La línea de tiempo dura {duracion} y debería durar {esperado}.")
    except ElementTree.ParseError as e:
        fallos.append(f"timeline.fcpxml no es XML válido: {e}")
    previo = duracion_de(carpeta / "previo.mp4") if (carpeta / "previo.mp4").exists() else None
    if previo is not None and abs(previo - manifiesto["duracion_frames"] / fps) > 0.1:
        fallos.append(f"previo.mp4 dura {previo:.2f} s y la pieza {manifiesto['duracion_frames'] / fps:.2f} s.")
    return fallos


async def generar(
    pieza_id: str,
    raiz: Path,
    *,
    alternativas: bool,
    rutas: str,
    carpeta_destino: Optional[str],
    progreso: Progreso,
) -> tuple[Path, dict[str, Any]]:
    """Genera el paquete en `raiz` y devuelve la ruta del ZIP y el manifiesto."""
    await progreso(2, "Leyendo el montaje")
    linea = await linea_de_tiempo(pieza_id)
    proy = linea["proyecto"]
    fps = int(proy["fps"])
    ancho, alto = RESOLUCIONES.get(proy.get("formato_video") or "16:9", (1920, 1080))
    relacion_proyecto = ancho / alto
    pieza = linea["pieza"]
    fecha = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    nombre_pieza = pieza.get("titulo") or (f"capitulo-{pieza['numero']}" if pieza.get("numero") else "pieza")
    nombre = f"{slug(proy['nombre'])}_{slug(nombre_pieza)}_{fecha}"
    carpeta = raiz / nombre
    if carpeta.exists():
        shutil.rmtree(carpeta)
    for sub in ("video", "imagen", "audio/voces", "audio/musica", "audio/ambiente", "fichas"):
        (carpeta / sub).mkdir(parents=True, exist_ok=True)
    if alternativas:
        (carpeta / "alternativas").mkdir()

    avisos = list(linea["avisos"])
    manifiesto: dict[str, Any] = {
        "generado_por": "Picasso",
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "proyecto": proy["nombre"],
        "pieza": nombre_pieza,
        "revision_guion": linea["revision_guion"],
        "fps": fps,
        "resolucion": f"{ancho}x{alto}",
        "rutas": rutas,
        "planos": [],
        "voces": [],
        "pistas": [],
    }

    # --- vídeo e imagen -------------------------------------------------------------
    elementos: list[fcpxml.ElementoSpine] = []
    clips_previo: list[tuple[Optional[Path], int]] = []
    frames_plano: dict[str, int] = {}
    inicio_plano_f: dict[str, int] = {}
    reloj_f = 0
    total = max(len(linea["planos"]), 1)
    for i, p in enumerate(linea["planos"]):
        await progreso(5 + int(55 * i / total), f"Normalizando {p['etiqueta']}")
        esc, pl = p["etiqueta"].replace("E", "").split("·P")
        base = f"E{int(esc):02d}_P{int(pl):02d}"
        frames = _frames(p["duracion_s"], fps)
        frames_plano[p["plano_id"]] = frames
        inicio_plano_f[p["plano_id"]] = reloj_f
        entrada_manifiesto: dict[str, Any] = {
            "etiqueta": p["etiqueta"], "escena": p["escena_titulo"], "inicio_frames": reloj_f,
            "frames": frames, "archivo": None, "toma": None,
        }
        toma = p.get("toma")
        if toma:
            origen, medio = await _medio(toma["medio_id"])
            nombre_clip = f"{base}_t{toma['numero']}"
            destino = carpeta / "video" / f"{nombre_clip}.mp4"
            es_imagen = toma["clase"] == "imagen"
            if es_imagen:
                shutil.copy2(origen, carpeta / "imagen" / f"{nombre_clip}{origen.suffix}")
            relacion = _relacion_de(origen)
            if relacion and abs(relacion - relacion_proyecto) > 0.02:
                avisos.append(f"{p['etiqueta']}: la toma no tiene la relación de aspecto del proyecto; va encajada con bandas.")
            await asyncio.to_thread(_normalizar_video, origen, destino, frames, ancho, alto, fps, es_imagen)
            if alternativas and not es_imagen:
                shutil.copy2(origen, carpeta / "alternativas" / f"{nombre_clip}_original{origen.suffix}")
            entrada_manifiesto.update({"archivo": f"video/{nombre_clip}.mp4", "toma": toma["numero"], "modelo": None})
            op = await db.operaciones.find_one({"_id": (await db.tomas.find_one({"_id": toma["id"]}) or {}).get("operacion_id")})
            if op:
                entrada_manifiesto.update({"modelo": op.get("modelo"), "coste": op.get("coste_real") or op.get("coste_estimado")})
            elementos.append(fcpxml.ElementoSpine(nombre=nombre_clip, duracion_f=frames, ruta=f"video/{nombre_clip}.mp4"))
            clips_previo.append((destino, frames))
        else:
            destino = carpeta / "video" / f"{base}_hueco.mp4"
            await asyncio.to_thread(
                _clip_hueco, destino, f"{p['etiqueta']} · sin toma", frames, ancho, alto, fps
            )
            entrada_manifiesto.update({"archivo": f"video/{base}_hueco.mp4", "hueco": True})
            elementos.append(fcpxml.ElementoSpine(nombre=f"{base}_hueco", duracion_f=frames, ruta=f"video/{base}_hueco.mp4"))
            clips_previo.append((destino, frames))
        if alternativas:
            otras = await db.tomas.find(
                {"plano_id": p["plano_id"], "es_exploracion": {"$ne": True}}
            ).sort("numero", 1).to_list(200)
            for t in otras:
                if toma and t["_id"] == toma["id"]:
                    continue
                try:
                    o, _ = await _medio(t["medio_id"])
                except ErrorPaquete:
                    continue
                shutil.copy2(o, carpeta / "alternativas" / f"{base}_t{t.get('numero')}{o.suffix}")
        manifiesto["planos"].append(entrada_manifiesto)
        reloj_f += frames
    manifiesto["duracion_frames"] = reloj_f

    # --- voces --------------------------------------------------------------------------
    await progreso(62, "Preparando las voces")
    audios_previo: list[tuple[Path, int, float]] = []
    usados: dict[str, int] = {}
    indice_elemento = {p["plano_id"]: i for i, p in enumerate(linea["planos"])}
    for v in linea["voces"]:
        esc, pl = (v["etiqueta_plano"] or "E0·P0").replace("E", "").split("·P")
        base = f"E{int(esc):02d}_P{int(pl):02d}_{slug(v['hablante_nombre'])}"
        usados[base] = usados.get(base, 0) + 1
        nombre_voz = base if usados[base] == 1 else f"{base}_{usados[base]}"
        origen, _ = await _medio(v["medio_id"])
        destino = carpeta / "audio" / "voces" / f"{nombre_voz}.wav"
        await asyncio.to_thread(_normalizar_audio, origen, destino, True)
        dur = duracion_de(destino) or (v["duracion_s"] or 1)
        desfase_f = round(v["desfase_s"] * fps)
        elementos[indice_elemento[v["plano_id"]]].audios.append(
            fcpxml.ClipAudio(nombre=nombre_voz, ruta=f"audio/voces/{nombre_voz}.wav",
                             duracion_f=_frames(dur, fps), offset_f=desfase_f, lane=fcpxml.LANE_VOCES)
        )
        inicio_f = inicio_plano_f[v["plano_id"]] + desfase_f
        audios_previo.append((destino, round(inicio_f / fps * 1000), 0.0))
        manifiesto["voces"].append({
            "archivo": f"audio/voces/{nombre_voz}.wav", "plano": v["etiqueta_plano"], "hablante": v["hablante_nombre"],
            "texto": v["texto"], "inicio_frames": inicio_f, "desfase_frames": desfase_f,
            "desactualizada": v["desactualizada"],
        })

    # --- música y ambiente ----------------------------------------------------------------
    await progreso(70, "Preparando música y ambiente")
    for pista in linea["pistas"]:
        capa = pista["capa"]
        origen, _ = await _medio(pista["medio_id"])
        nombre_pista = slug(Path(pista["nombre"]).stem or pista["nombre"])
        destino = carpeta / "audio" / capa / f"{nombre_pista}.wav"
        n = 2
        while destino.exists():
            destino = carpeta / "audio" / capa / f"{nombre_pista}_{n}.wav"
            n += 1
        await asyncio.to_thread(_normalizar_audio, origen, destino, False)
        dur = duracion_de(destino) or 1
        inicio_f = round(pista["inicio_s"] * fps)
        # En la línea de tiempo la pista se corta al final de la pieza; el archivo va entero.
        visible_f = min(_frames(dur, fps), max(reloj_f - inicio_f, 0))
        if visible_f <= 0:
            avisos.append(f"La pista «{pista['nombre']}» empieza después del final de la pieza: no entra en la línea de tiempo.")
        elif elementos:
            elementos[0].audios.append(
                fcpxml.ClipAudio(
                    nombre=destino.stem, ruta=f"audio/{capa}/{destino.name}", duracion_f=visible_f,
                    offset_f=inicio_f, canales=_canales(destino), volumen_db=pista["volumen_db"],
                    lane=fcpxml.LANE_MUSICA if capa == "musica" else fcpxml.LANE_AMBIENTE,
                )
            )
        audios_previo.append((destino, round(inicio_f / fps * 1000), float(pista["volumen_db"])))
        manifiesto["pistas"].append({
            "archivo": f"audio/{capa}/{destino.name}", "capa": capa, "nombre": pista["nombre"],
            "inicio_frames": inicio_f, "volumen_db": pista["volumen_db"],
        })

    # --- fichas, guion, línea de tiempo, previo ------------------------------------------
    await progreso(76, "Copiando las fichas")
    manifiesto["fichas"] = await _fichas(proy["id"], carpeta / "fichas")

    guion = await db.guiones.find_one({"pieza_id": pieza_id})
    escenas = await db.escenas.find({"guion_id": guion["_id"], "borrador": False}).sort("orden", 1).to_list(500)
    nombres = {}
    for e in escenas:
        for d in e.get("dialogos") or []:
            if d["hablante"] != "narrador" and d["hablante"] not in nombres:
                el = await db.elementos.find_one({"_id": d["hablante"]})
                nombres[d["hablante"]] = (el or {}).get("nombre", "?")
    (carpeta / "guion.md").write_text(_guion_md(escenas, linea["revision_guion"], nombres), encoding="utf-8")

    await progreso(80, "Escribiendo la línea de tiempo")
    base_absoluta = str(Path(carpeta_destino) / nombre) if rutas == "absolutas" and carpeta_destino else None
    (carpeta / "timeline.fcpxml").write_text(
        fcpxml.construir(proyecto=f"{proy['nombre']} · {nombre_pieza}", fps=fps, ancho=ancho, alto=alto,
                         elementos=elementos, base_absoluta=base_absoluta),
        encoding="utf-8",
    )

    await progreso(84, "Montando el previo")
    if reloj_f:
        await asyncio.to_thread(_previo, carpeta, clips_previo, audios_previo, fps, ancho, alto, reloj_f)

    manifiesto["avisos"] = avisos
    manifiesto["coste_total"] = round(sum(p.get("coste") or 0 for p in manifiesto["planos"]), 2)
    (carpeta / "LEEME.md").write_text(_leeme(nombre, fps, ancho, alto, rutas, avisos), encoding="utf-8")
    (carpeta / "manifiesto.json").write_text(json.dumps(manifiesto, ensure_ascii=False, indent=2), encoding="utf-8")

    await progreso(92, "Comprobando el paquete")
    fallos = await asyncio.to_thread(_comprobar, carpeta, manifiesto, fps)
    if fallos:
        raise ErrorPaquete("La comprobación del paquete ha fallado: " + " · ".join(fallos))

    await progreso(96, "Comprimiendo")
    zip_ruta = raiz / f"{nombre}.zip"
    def comprimir() -> None:
        with zipfile.ZipFile(zip_ruta, "w", zipfile.ZIP_DEFLATED) as z:
            # Las carpetas vacías también van: la estructura es siempre la misma (§11.3).
            z.write(carpeta, carpeta.relative_to(raiz))
            for f in sorted(carpeta.rglob("*")):
                z.write(f, f.relative_to(raiz))

    await asyncio.to_thread(comprimir)
    shutil.rmtree(carpeta, ignore_errors=True)
    return zip_ruta, manifiesto
