"""Proveedor `simulado` (§9.1). Por defecto en desarrollo y en las pruebas.

Genera ficheros REALES con ffmpeg (PNG, MP4 H.264, WAV) marcados «SIMULADO»,
con latencia configurable y fallos provocables (`fallo`, `incierto`, `timeout`).

- `incierto`: el trabajo SÍ queda registrado aquí, pero `enviar` no contesta.
  Después, `Comprobar` con el `id_remoto` lo encuentra completado sin volver a
  enviar nada.
- `timeout`: igual, pero el que no contesta es `consultar`.
- Todo determinista: la misma clave de idempotencia da el mismo fichero.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
from decimal import Decimal
from pathlib import Path

from app.dominio.modelos import Accion, EntradaOperacion, SimulacionPrueba
from app.motor import catalogo as cat
from app.motor import ficheros
from app.motor.contrato import EstadoRemoto, EstadoRemotoNombre, SinRespuesta

LATENCIA_S = float(os.environ.get("LATENCIA_SIMULADO_S") or 1.2)
CARACTERES_POR_SEGUNDO = 15.0

CLASE_DE_ACCION: dict[Accion, str] = {
    Accion.generar_imagen: "imagen",
    Accion.editar_imagen: "imagen",
    Accion.imagen_con_referencias: "imagen",
    Accion.generar_video: "video",
    Accion.sincronizar_labios: "video",
    Accion.personaje_hablando: "video",
    Accion.generar_voz: "audio",
}


class Trabajo:
    def __init__(self, id_remoto: str, entradas: EntradaOperacion, clave: str):
        self.id_remoto = id_remoto
        self.entradas = entradas
        self.clave = clave
        self.estado = EstadoRemotoNombre.en_cola
        self.urls: list[str] = []
        self.ficheros: dict[str, Path] = {}
        self.error: str | None = None
        self.coste_real: Decimal | None = None
        self.progreso: float = 0.0
        self.calla_al_consultar = entradas.simular_resultado == SimulacionPrueba.timeout


class ProveedorSimulado:
    id = "simulado"

    def __init__(self, carpeta: Path | None = None):
        self.carpeta = Path(carpeta or "/tmp/picasso_simulado")
        self._por_clave: dict[str, Trabajo] = {}
        self._por_remoto: dict[str, Trabajo] = {}
        self.envios_remotos = 0  # lo comprueban las pruebas: uno por clave

    def modelos(self) -> list[str]:
        return [m.id for m in cat.catalogo() if self.id in m.proveedores and not m.plantilla]

    def estimar(self, op: EntradaOperacion) -> Decimal | None:
        m = cat.modelo(op.modelo)
        return cat.estimar(m, op) if m else None

    async def enviar(self, op: EntradaOperacion, clave_idempotencia: str) -> str:
        trabajo = self._por_clave.get(clave_idempotencia)
        if trabajo is None:
            id_remoto = hashlib.sha256(clave_idempotencia.encode("utf-8")).hexdigest()[:16]
            trabajo = Trabajo(id_remoto, op, clave_idempotencia)
            self._por_clave[clave_idempotencia] = trabajo
            self._por_remoto[id_remoto] = trabajo
            self.envios_remotos += 1
            asyncio.create_task(self._producir(trabajo))
            if op.simular_resultado == SimulacionPrueba.incierto:
                raise SinRespuesta(
                    "El envío no ha contestado (incierto simulado). El trabajo quedó registrado.",
                    id_remoto=id_remoto,
                )
        return trabajo.id_remoto

    async def consultar(self, id_remoto: str) -> EstadoRemoto:
        trabajo = self._por_remoto.get(id_remoto)
        if trabajo is None:
            raise SinRespuesta("El proveedor no reconoce ese trabajo.", id_remoto=id_remoto)
        if trabajo.calla_al_consultar:
            trabajo.calla_al_consultar = False
            raise SinRespuesta("La consulta no ha contestado (timeout simulado).", id_remoto)
        if trabajo.estado == EstadoRemotoNombre.completado:
            return EstadoRemoto(
                estado=trabajo.estado,
                urls=tuple(trabajo.urls),
                coste_real=trabajo.coste_real,
                progreso=1.0,
            )
        return EstadoRemoto(
            estado=trabajo.estado, error=trabajo.error, progreso=trabajo.progreso
        )

    async def descargar(self, url: str) -> bytes:
        _, resto = url.split("://", 1)
        id_remoto, nombre = resto.split("/", 1)
        return Path(self._por_remoto[id_remoto].ficheros[nombre]).read_bytes()

    # --- interior -----------------------------------------------------------

    def _encargo(self, op: EntradaOperacion, indice: int, clave: str) -> ficheros.Encargo:
        m = cat.modelo(op.modelo)
        formato = m.formato if m else None
        clase = CLASE_DE_ACCION[op.accion]
        duracion = float(op.duracion_s or 3)
        if op.accion == Accion.generar_voz:
            duracion = max(0.5, round(len(op.texto or "") / CARACTERES_POR_SEGUNDO, 2))
        if op.audio_entrada:
            duracion = ficheros.duracion_de(op.audio_entrada.ruta) or duracion
        variante = op.variantes[indice] if indice < len(op.variantes) else None

        rotulos: list[str] = []
        if op.etiqueta_destino:
            rotulos.append(f"plano {op.etiqueta_destino}")
        rotulos.append(f"{op.accion.value} · {op.modelo}")
        if variante:
            rotulos.append(
                "encuadre " + " · ".join([t for t in (variante.encuadre, variante.angulo) if t])
            )
        rotulos += [r for r in op.rotulos]
        rotulos.append(f"clave {clave[:8]} · variante {indice + 1}")
        if op.n_variantes > 1:
            rotulos.append(f"variante {indice + 1} de {op.n_variantes}")
        if op.instruccion:
            rotulos.append(f"editado: {op.instruccion}")

        base = None
        if op.imagen_entrada:
            base = op.imagen_entrada.ruta
        elif op.retrato:
            base = op.retrato.ruta
        elif op.primer_fotograma:
            base = op.primer_fotograma.ruta

        return ficheros.Encargo(
            clase=clase,
            relacion=op.relacion_aspecto or "16:9",
            duracion_s=duracion,
            fps=(formato.fps if formato else 25),
            lado_largo=(
                (formato.png_lado_largo if clase == "imagen" else formato.lado_largo)
                if formato
                else 1280
            ),
            hz=(formato.hz if formato else 48000),
            rotulos=rotulos,
            referencias=[r.ruta for r in op.referencias][:4],
            imagen_base=base,
            audio=(op.audio_entrada.ruta if op.audio_entrada else None),
            semilla=f"{clave}:{indice}",
        )

    def _falla_esta_variante(self, op: EntradaOperacion, indice: int) -> bool:
        if op.simular_resultado == SimulacionPrueba.fallo:
            return True
        if op.modelo == "sim-inestable" and op.simular_resultado == SimulacionPrueba.normal:
            # En una lámina de encuadres fallan solo las variantes pares: así se
            # ve el cobro de lo producido y el reintento suelto de lo fallido.
            return op.n_variantes == 1 or indice % 2 == 1
        return False

    async def _producir(self, trabajo: Trabajo) -> None:
        op = trabajo.entradas
        trabajo.estado = EstadoRemotoNombre.en_curso
        await asyncio.sleep(LATENCIA_S)
        salidas = max(1, op.n_variantes)
        producidas = 0
        for i in range(salidas):
            trabajo.progreso = round((i + 1) / salidas, 2)
            if self._falla_esta_variante(op, i):
                continue
            try:
                encargo = self._encargo(op, i, trabajo.clave)
                ruta = await ficheros.generar_async(
                    self.carpeta / trabajo.id_remoto, f"salida-{i}", encargo
                )
            except Exception as e:  # noqa: BLE001
                trabajo.error = f"No se ha podido generar el material simulado: {e}"
                continue
            nombre = ruta.name
            trabajo.ficheros[nombre] = ruta
            trabajo.urls.append(f"simulado://{trabajo.id_remoto}/{nombre}")
            producidas += 1

        if producidas == 0:
            trabajo.estado = EstadoRemotoNombre.fallido
            trabajo.error = trabajo.error or (
                "El modelo simulado ha devuelto un error a propósito. Reintentar crea "
                "un intento nuevo y pide autorizar otra vez."
            )
            return
        m = cat.modelo(op.modelo)
        estimado = cat.estimar(m, op) if m else None
        if estimado is not None and salidas > 1:
            estimado = cat.a_centimos(estimado / Decimal(salidas) * Decimal(producidas))
        trabajo.coste_real = estimado  # en el modelo sin precio, también None
        trabajo.estado = EstadoRemotoNombre.completado
