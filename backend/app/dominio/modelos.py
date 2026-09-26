from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


def ahora() -> str:
    return datetime.now(timezone.utc).isoformat()


def nuevo_id() -> str:
    return uuid.uuid4().hex


# --- Vocabulario cerrado (§2). Validado en el borde por estos enums. ---


class TipoEspacio(str, Enum):
    cliente = "cliente"
    marca = "marca"
    propio = "propio"


class TipoProyecto(str, Enum):
    corto = "corto"
    anuncio = "anuncio"
    imagen = "imagen"
    serie = "serie"


class FormatoVideo(str, Enum):
    v9_16 = "9:16"
    v16_9 = "16:9"
    v1_1 = "1:1"
    v4_5 = "4:5"


class ClaseElemento(str, Enum):
    personaje = "personaje"
    producto = "producto"
    objeto = "objeto"
    escenario = "escenario"


class ClaseMedio(str, Enum):
    imagen = "imagen"
    video = "video"
    audio = "audio"
    documento = "documento"


class RolReferencia(str, Enum):
    frontal = "frontal"
    perfil = "perfil"
    espalda = "espalda"
    detalle = "detalle"
    entorno = "entorno"
    otra = "otra"


# --- Espacio ---


class EspacioCrear(BaseModel):
    nombre: str
    tipo_espacio: TipoEspacio
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None


class EspacioEditar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None
    portada_id: Optional[str] = None
    logo_id: Optional[str] = None
    archivado: Optional[bool] = None
    updated_at: str  # esperado, para detectar conflicto (409)


class Espacio(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    nombre: str
    tipo_espacio: TipoEspacio
    descripcion: Optional[str] = None
    notas_de_marca: Optional[str] = None
    portada_id: Optional[str] = None
    logo_id: Optional[str] = None
    archivado: bool = False
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


# --- Proyecto ---


Fps = Literal[24, 25, 30]


class ProyectoCrear(BaseModel):
    nombre: str
    tipo: TipoProyecto
    formato_video: FormatoVideo
    fps: Fps = 25


class ProyectoEditar(BaseModel):
    nombre: Optional[str] = None
    formato_video: Optional[FormatoVideo] = None
    fps: Optional[Fps] = None
    voz_narrador: Optional[Voz] = None
    duracion_objetivo_s: Optional[int] = None
    presupuesto_max: Optional[float] = None
    pasos_omitidos: Optional[list[str]] = None
    updated_at: str


class Proyecto(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    espacio_id: str
    nombre: str
    tipo: TipoProyecto
    formato_id: Optional[str] = None
    formato_video: FormatoVideo
    fps: Fps = 25  # ritmo del montaje y del paquete (§3.1, §11.3)
    voz_narrador: Optional[Voz] = None
    duracion_objetivo_s: Optional[int] = None
    presupuesto_max: Optional[float] = None
    pasos_omitidos: list[str] = Field(default_factory=list)
    ultimo_acceso: str = Field(default_factory=ahora)
    ultima_ubicacion: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class Ubicacion(BaseModel):
    ultima_ubicacion: str


# --- Ajustes (global) ---


class Ajustes(BaseModel):
    moneda: str = "USD"
    presupuesto_por_defecto: float = 0.0
    proveedores_habilitados: list[str] = Field(default_factory=list)
    modelo_asistente: str = "simulado"


class AjustesEditar(BaseModel):
    moneda: Optional[str] = None
    presupuesto_por_defecto: Optional[float] = None
    modelo_asistente: Optional[str] = None


# --- Desarrollo (uno por proyecto) ---


class Desarrollo(BaseModel):
    intencion: Optional[str] = None
    publico: Optional[str] = None
    mensaje: Optional[str] = None
    tono: Optional[str] = None
    premisa: Optional[str] = None
    mundo: Optional[str] = None
    arco_general: Optional[str] = None
    notas: Optional[str] = None
    respuestas_formato: dict = Field(default_factory=dict)
    estado: str = "en_curso"  # en_curso | listo
    updated_at: Optional[str] = None  # sello de versión (§12): 409 si no coincide


# --- Asistente (§10) ---


class PeticionAsistente(BaseModel):
    campo: Optional[str] = None  # para proponer_campo
    clase: Optional[ClaseElemento] = None  # para detectar_elementos
    pieza_id: Optional[str] = None  # para las tareas del guion
    escena_id: Optional[str] = None  # para reescribir_escena


class AceptarParte(BaseModel):
    accion: str  # aceptar | descartar
    texto: Optional[str] = None  # texto editado por el usuario al aceptar
    destino_campo: Optional[str] = None  # campo elegido para una respuesta a pregunta


# --- Medio (§3.1) ---


class Medio(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    espacio_id: str
    clase: ClaseMedio
    ruta: str
    mime: str
    nombre_original: Optional[str] = None
    etiqueta: Optional[str] = None
    ancho: Optional[int] = None
    alto: Optional[int] = None
    duracion_s: Optional[float] = None
    origen: str = "importado"  # importado | generado
    operacion_id: Optional[str] = None
    etiqueta_demo: bool = False
    hash: str
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


# --- Elemento y FichaVersion (§3.1) ---


class Referencia(BaseModel):
    medio_id: str
    rol: RolReferencia = RolReferencia.otra


class ElementoCrear(BaseModel):
    clase: ClaseElemento
    nombre: str


class ElementoEditar(BaseModel):
    nombre: Optional[str] = None
    updated_at: str


class Elemento(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    espacio_id: str
    clase: ClaseElemento
    nombre: str
    ficha_vigente: int = 1
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class Voz(BaseModel):
    proveedor: Optional[str] = None
    voice_id: Optional[str] = None
    ajustes: dict = Field(default_factory=dict)


class FichaEditar(BaseModel):
    """Solo se puede editar una ficha en `borrador`. Aprobar la congela."""

    descripcion: Optional[str] = None
    rasgos_fijos: Optional[list[str]] = None
    rasgos_variables: Optional[list[str]] = None
    referencias: Optional[list[Referencia]] = None
    personalidad: Optional[str] = None
    voz: Optional[Voz] = None
    materiales_colores: Optional[str] = None
    ambiente: Optional[str] = None
    distribucion: Optional[str] = None
    nota_cambio: Optional[str] = None
    updated_at: str


class FichaVersion(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    elemento_id: str
    version: int
    descripcion: Optional[str] = None
    rasgos_fijos: list[str] = Field(default_factory=list)
    rasgos_variables: list[str] = Field(default_factory=list)
    referencias: list[Referencia] = Field(default_factory=list)
    personalidad: Optional[str] = None
    voz: Optional[Voz] = None
    materiales_colores: Optional[str] = None
    ambiente: Optional[str] = None
    distribucion: Optional[str] = None
    nota_cambio: Optional[str] = None
    estado: str = "borrador"  # borrador | aprobada
    aprobada_en: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


# --- Reparto (§3.1) ---


class RepartoCrear(BaseModel):
    elemento_id: str
    papel: Optional[str] = None


class RepartoEditar(BaseModel):
    version_ficha: Optional[int] = None
    papel: Optional[str] = None


class Reparto(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    proyecto_id: str
    elemento_id: str
    version_ficha: int
    papel: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


# --- Pieza, Guion, Escena y Encargo de imagen (§3.1, §6.3) ---


class PiezaCrear(BaseModel):
    numero: Optional[int] = None
    titulo: Optional[str] = None
    de_que_va: Optional[str] = None


class PiezaEditar(BaseModel):
    numero: Optional[int] = None
    titulo: Optional[str] = None
    de_que_va: Optional[str] = None
    updated_at: str


class Pieza(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    proyecto_id: str
    numero: Optional[int] = None
    titulo: Optional[str] = None
    de_que_va: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class EncargoImagen(BaseModel):
    que_se_muestra: Optional[str] = None
    composicion: Optional[str] = None
    intencion: Optional[str] = None
    elementos: list[str] = Field(default_factory=list)  # ids del reparto
    referencias: list[str] = Field(default_factory=list)  # ids de medios
    numero_imagenes: int = 1


class Guion(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    pieza_id: str
    clase: str = "escenas"  # escenas | encargo (tipo imagen, §3.1)
    estado: str = "borrador"  # borrador | aprobado
    aprobado_en: Optional[str] = None
    revision: int = 0
    revision_en_curso: Optional[dict] = None  # {creada_en}: copia en borrador de las escenas
    encargo: Optional[EncargoImagen] = None  # versión aprobada (clase encargo)
    encargo_borrador: Optional[EncargoImagen] = None  # copia de trabajo
    historial_revisiones: list[dict] = Field(default_factory=list)
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class Dialogo(BaseModel):
    # Estable: se conserva al copiar la escena en una revisión y ata cada voz a
    # su diálogo (§3.1, §11.1).
    id: str = Field(default_factory=nuevo_id)
    hablante: str  # elemento_id | "narrador"
    texto: str = ""


class EscenaCrear(BaseModel):
    titulo: Optional[str] = None


class EscenaEditar(BaseModel):
    titulo: Optional[str] = None
    que_ocurre: Optional[str] = None
    que_se_ve: Optional[str] = None
    intencion: Optional[str] = None
    elementos: Optional[list[str]] = None
    dialogos: Optional[list[Dialogo]] = None
    sonido_previsto: Optional[str] = None
    duracion_orientativa_s: Optional[float] = None
    updated_at: str


class Escena(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    guion_id: str
    orden: int
    borrador: bool = True  # True: escena de trabajo; False: escena del guion aprobado
    origen_id: Optional[str] = None  # escena aprobada de la que es copia
    titulo: str = ""
    que_ocurre: str = ""
    que_se_ve: str = ""
    intencion: str = ""
    elementos: list[str] = Field(default_factory=list)  # ids del reparto
    dialogos: list[Dialogo] = Field(default_factory=list)
    sonido_previsto: Optional[str] = None
    duracion_orientativa_s: Optional[float] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class EncargoEditar(BaseModel):
    que_se_muestra: Optional[str] = None
    composicion: Optional[str] = None
    intencion: Optional[str] = None
    elementos: Optional[list[str]] = None
    referencias: Optional[list[str]] = None
    numero_imagenes: Optional[int] = None


class AprobarRevision(BaseModel):
    marcas: dict[str, str]  # escena_id -> solo_texto | afecta_planos


# --- Fase 5: lienzo, planos y dirección (§7, §7.7, §8) ---


class Modalidad(str, Enum):
    imagen = "imagen"
    video = "video"


class Correccion(BaseModel):
    """Instrucción en lenguaje llano sobre un plano (§7.7d)."""

    id: str = Field(default_factory=nuevo_id)
    texto: str
    estado: str = "pendiente"  # pendiente | hecha
    creada_en: str = Field(default_factory=ahora)
    hecha_en: Optional[str] = None
    operacion_id: Optional[str] = None  # Fase 6
    toma_id: Optional[str] = None  # Fase 6


class Direccion(BaseModel):
    """Caja de herramientas del director (§8). Ningún campo es obligatorio.
    En vídeo manda el encuadre/ángulo de inicio y de final (§7.7c); en imagen,
    `encuadre` y `angulo`. Lo que no se muestra se guarda, no se pierde."""

    protagonista_visual: Optional[str] = None
    encuadre: Optional[str] = None
    angulo: Optional[str] = None
    encuadre_inicio: Optional[str] = None
    angulo_inicio: Optional[str] = None
    encuadre_final: Optional[str] = None
    angulo_final: Optional[str] = None
    movimiento_camara: Optional[str] = None
    optica: Optional[str] = None
    profundidad_campo: Optional[str] = None
    luz_direccion: Optional[str] = None
    luz_calidad: Optional[str] = None
    luz_momento: Optional[str] = None
    temperatura_color: Optional[str] = None
    ambiente: Optional[str] = None
    acabado: Optional[str] = None
    accion: Optional[str] = None
    negativos: Optional[str] = None
    # reparto_id -> rasgos variables que aplican en este plano
    vestuario_y_variables: dict[str, list[str]] = Field(default_factory=dict)


class Plano(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    pieza_id: str
    escena_id: Optional[str] = None  # None en tipo imagen (§3.1)
    orden: int
    que_se_muestra: str = ""
    modalidad: Modalidad = Modalidad.imagen
    duracion_s: Optional[float] = None
    elementos: list[str] = Field(default_factory=list)  # ids del reparto
    direccion: Direccion = Field(default_factory=Direccion)
    toma_elegida_id: Optional[str] = None
    plano_anterior_encadenado: bool = False
    correcciones: list[Correccion] = Field(default_factory=list)
    prompt_editado_a_mano: bool = False
    prompt_manual: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class PlanoCrear(BaseModel):
    que_se_muestra: Optional[str] = None
    modalidad: Optional[Modalidad] = None


class PlanoEditar(BaseModel):
    que_se_muestra: Optional[str] = None
    modalidad: Optional[Modalidad] = None
    duracion_s: Optional[float] = None
    elementos: Optional[list[str]] = None
    direccion: Optional[Direccion] = None
    plano_anterior_encadenado: Optional[bool] = None
    updated_at: str


class MoverPlano(BaseModel):
    direccion: Optional[str] = None  # antes | despues
    a: Optional[int] = None  # posición destino (0-based)


class CorreccionCrear(BaseModel):
    texto: str


class CorreccionEditar(BaseModel):
    estado: str  # pendiente | hecha


class PromptManual(BaseModel):
    texto: str


class Posicion(BaseModel):
    x: float
    y: float


class Viewport(BaseModel):
    x: float = 0
    y: float = 0
    zoom: float = 1


# --- Fase 6: motor de producción (§9), tomas y registro ----------------------


class Accion(str, Enum):
    """Acciones del motor (§9.2)."""

    generar_imagen = "generar_imagen"
    editar_imagen = "editar_imagen"
    imagen_con_referencias = "imagen_con_referencias"
    generar_video = "generar_video"
    generar_voz = "generar_voz"
    sincronizar_labios = "sincronizar_labios"
    personaje_hablando = "personaje_hablando"


class SimulacionPrueba(str, Enum):
    """Qué resultado se provoca a propósito. Solo lo acepta el proveedor
    `simulado`; cualquier otro lo rechaza."""

    normal = "normal"
    fallo = "fallo"
    incierto = "incierto"
    timeout = "timeout"


class EstadoOperacion(str, Enum):
    """Ciclo del §9.4."""

    preparada = "preparada"
    presupuestada = "presupuestada"
    autorizada = "autorizada"
    enviada = "enviada"
    en_curso = "en_curso"
    completada = "completada"
    incierta = "incierta"
    fallida = "fallida"
    descartada = "descartada"


class ReferenciaEntrada(BaseModel):
    model_config = ConfigDict(frozen=True)

    medio_id: str
    ruta: str
    rol: str = "otra"


class MedioEntrada(BaseModel):
    model_config = ConfigDict(frozen=True)

    medio_id: str
    ruta: str


class AjustesVoz(BaseModel):
    model_config = ConfigDict(frozen=True)

    proveedor: Optional[str] = None
    voice_id: Optional[str] = None
    ajustes: dict[str, str] = Field(default_factory=dict)


class VarianteEncuadre(BaseModel):
    """Una variante de la lámina de encuadres (§8)."""

    model_config = ConfigDict(frozen=True)

    encuadre: Optional[str] = None
    angulo: Optional[str] = None


# Qué campos exige cada acción y cuáles no le tocan (§9.2).
_EXIGE: dict[str, tuple[str, ...]] = {
    "generar_imagen": ("prompt",),
    "editar_imagen": ("imagen_entrada", "instruccion"),
    "imagen_con_referencias": ("prompt", "referencias"),
    "generar_video": ("prompt",),
    "generar_voz": ("texto",),
    "sincronizar_labios": ("video_entrada", "audio_entrada"),
    "personaje_hablando": ("retrato", "audio_entrada"),
}
_PROHIBE: dict[str, tuple[str, ...]] = {
    "generar_imagen": (
        "imagen_entrada", "instruccion", "primer_fotograma", "ultimo_fotograma",
        "video_entrada", "audio_entrada", "retrato", "texto", "voz",
    ),
    "editar_imagen": (
        "primer_fotograma", "ultimo_fotograma", "video_entrada", "audio_entrada",
        "retrato", "texto", "voz",
    ),
    "imagen_con_referencias": (
        "imagen_entrada", "instruccion", "primer_fotograma", "ultimo_fotograma",
        "video_entrada", "audio_entrada", "retrato", "texto", "voz",
    ),
    "generar_video": (
        "imagen_entrada", "instruccion", "video_entrada", "audio_entrada",
        "retrato", "texto", "voz",
    ),
    "generar_voz": (
        "prompt", "negativos", "referencias", "imagen_entrada", "instruccion",
        "primer_fotograma", "ultimo_fotograma", "video_entrada", "audio_entrada", "retrato",
    ),
    "sincronizar_labios": (
        "imagen_entrada", "instruccion", "primer_fotograma", "ultimo_fotograma",
        "retrato", "texto", "voz", "prompt",
    ),
    "personaje_hablando": (
        "imagen_entrada", "instruccion", "primer_fotograma", "ultimo_fotograma",
        "video_entrada", "texto", "prompt",
    ),
}


class EntradaOperacion(BaseModel):
    """Lo que se envía al proveedor (§9.1). Inmutable: su huella es la clave de
    idempotencia. Un validador comprueba que cada acción lleva los campos que
    necesita y ninguno que no le toque."""

    model_config = ConfigDict(frozen=True)

    accion: Accion
    modelo: str
    prompt: Optional[str] = None
    negativos: Optional[str] = None
    referencias: tuple[ReferenciaEntrada, ...] = ()
    imagen_entrada: Optional[MedioEntrada] = None
    instruccion: Optional[str] = None
    primer_fotograma: Optional[MedioEntrada] = None
    ultimo_fotograma: Optional[MedioEntrada] = None
    duracion_s: Optional[float] = None
    relacion_aspecto: Optional[str] = None
    resolucion: Optional[str] = None
    texto: Optional[str] = None
    voz: Optional[AjustesVoz] = None
    video_entrada: Optional[MedioEntrada] = None
    audio_entrada: Optional[MedioEntrada] = None
    retrato: Optional[MedioEntrada] = None
    n_variantes: int = 1
    variantes: tuple[VarianteEncuadre, ...] = ()
    etiqueta_destino: Optional[str] = None
    rotulos: tuple[str, ...] = ()
    simular_resultado: SimulacionPrueba = SimulacionPrueba.normal

    @model_validator(mode="after")
    def _coherente(self) -> "EntradaOperacion":
        accion = self.accion.value
        for campo in _EXIGE[accion]:
            if not getattr(self, campo):
                raise ValueError(f"«{accion}» necesita «{campo}».")
        for campo in _PROHIBE[accion]:
            if getattr(self, campo):
                raise ValueError(f"«{accion}» no lleva «{campo}».")
        if self.n_variantes > 1 and accion not in ("generar_imagen", "imagen_con_referencias"):
            raise ValueError("Las variantes solo se piden al generar imágenes (§8, §6.2).")
        if self.n_variantes != max(1, len(self.variantes) or self.n_variantes):
            raise ValueError("El número de variantes no cuadra con la lista de variantes.")
        return self


class Destino(BaseModel):
    tipo: str  # plano | ficha | medio
    id: str


class Operacion(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    proyecto_id: str
    espacio_id: str
    destino: Destino
    accion: Accion
    modelo: str
    proveedor: Optional[str] = None
    proveedores_descartados: list[str] = Field(default_factory=list)
    entradas: EntradaOperacion
    prompt_visible: str = ""
    coste_estimado: Optional[float] = None
    coste_unidad: str = "operacion"
    coste_verificado: bool = False
    coste_real: Optional[float] = None
    estado: EstadoOperacion = EstadoOperacion.preparada
    clave_idempotencia: str = ""
    correccion_id: Optional[str] = None
    toma_origen_id: Optional[str] = None
    es_exploracion: bool = False
    error: Optional[str] = None
    intentos: int = 0
    variantes_fallidas: list[int] = Field(default_factory=list)
    posicion_cola: Optional[int] = None
    autorizada_en: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class Intento(BaseModel):
    id: str = Field(default_factory=nuevo_id)
    operacion_id: str
    numero: int = 1
    proveedor: str
    id_remoto: Optional[str] = None
    estado: str = "enviada"  # enviada | en_curso | completada | incierta | fallida
    clave_idempotencia: str = ""
    coste_real: Optional[float] = None
    error: Optional[str] = None
    inicio: str = Field(default_factory=ahora)
    fin: Optional[str] = None
    medios_resultado: list[str] = Field(default_factory=list)


class Toma(BaseModel):
    plano_id: Optional[str] = None
    ficha_version_id: Optional[str] = None
    id: str = Field(default_factory=nuevo_id)
    medio_id: str
    operacion_id: Optional[str] = None
    numero: int = 1
    fichas_usadas: dict[str, int] = Field(default_factory=dict)
    revision_guion: int = 0
    valoracion: Optional[str] = None  # buena | descartada | None
    nota: Optional[str] = None
    es_exploracion: bool = False
    exploracion: Optional[VarianteEncuadre] = None
    correccion_id: Optional[str] = None
    dialogo_id: Optional[str] = None  # tomas de voz (§11.1)
    texto_usado: Optional[str] = None  # texto con que se produjo la voz
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class VozDialogo(BaseModel):
    """La voz de un diálogo (§3.1 «Voz», §11.1). Una por diálogo; su `_id` es el
    del diálogo."""

    id: str  # = dialogo_id
    escena_id: str  # escena aprobada del diálogo
    plano_id: Optional[str] = None  # dónde suena; None = primer plano de la escena
    desfase_s: float = Field(default=0, ge=0)
    toma_elegida_id: Optional[str] = None
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class VozDialogoEditar(BaseModel):
    plano_id: Optional[str] = None
    desfase_s: Optional[float] = Field(default=None, ge=0)


class CapaAudio(str, Enum):
    musica = "musica"
    ambiente = "ambiente"


class PistaAudio(BaseModel):
    """Música o ambiente importados a una pieza (§3.1 «PistaAudio», §11.2)."""

    id: str = Field(default_factory=nuevo_id)
    pieza_id: str
    capa: CapaAudio
    medio_id: str
    nombre: str = ""
    inicio_s: float = Field(default=0, ge=0)  # desde el inicio de la pieza
    volumen_db: float = Field(default=0, ge=-60, le=12)
    created_at: str = Field(default_factory=ahora)
    updated_at: str = Field(default_factory=ahora)


class PistaAudioCrear(BaseModel):
    capa: CapaAudio
    medio_id: str
    nombre: Optional[str] = None
    inicio_s: float = Field(default=0, ge=0)
    volumen_db: float = Field(default=0, ge=-60, le=12)


class PistaAudioEditar(BaseModel):
    nombre: Optional[str] = None
    inicio_s: Optional[float] = Field(default=None, ge=0)
    volumen_db: Optional[float] = Field(default=None, ge=-60, le=12)


class PrepararOperacion(BaseModel):
    """Cuerpo de `POST /api/operaciones` (§9.4.1 y 2). No envía nada."""

    destino_tipo: str = "plano"
    destino_id: str
    proyecto_id: Optional[str] = None  # obligatorio cuando el destino es una ficha
    accion: Accion
    modelo: str
    duracion_s: Optional[float] = None
    instruccion: Optional[str] = None
    texto: Optional[str] = None
    n_variantes: Optional[int] = None
    correccion_id: Optional[str] = None
    toma_origen_id: Optional[str] = None
    prompt_manual: Optional[str] = None
    simular_resultado: SimulacionPrueba = SimulacionPrueba.normal


class EditarOperacion(BaseModel):
    """PATCH: solo en `preparada` o `presupuestada`. Recalcula el coste y no
    envía nada."""

    modelo: Optional[str] = None
    duracion_s: Optional[float] = None
    instruccion: Optional[str] = None
    texto: Optional[str] = None
    n_variantes: Optional[int] = None
    prompt_manual: Optional[str] = None
    simular_resultado: Optional[SimulacionPrueba] = None


class Autorizacion(BaseModel):
    confirmado_por_encima_del_presupuesto: bool = False


class TomaEditar(BaseModel):
    valoracion: Optional[str] = None  # buena | descartada | ninguna
    nota: Optional[str] = None


class FijarExploracion(BaseModel):
    """§8: fijar los valores de una toma de exploración en la dirección."""

    momento: str = "inicio"  # inicio | final (solo vídeo)


class MoverAEscena(BaseModel):
    escena_id: str


class PasarAFicha(BaseModel):
    """Una toma de la lámina de referencias pasa a ser referencia de la ficha (§6.2)."""

    rol: str = "otra"


class LayoutLienzo(BaseModel):
    """Uno por proyecto (§3.1, §7.5). Posición ≠ orden (§7.4)."""

    posiciones: dict[str, Posicion] = Field(default_factory=dict)
    grupos_plegados: list[str] = Field(default_factory=list)
    viewport: Viewport = Field(default_factory=Viewport)
    seleccion: list[str] = Field(default_factory=list)
    pieza_activa: Optional[str] = None
    mostrar_conexiones_reparto: bool = True
    updated_at: Optional[str] = None
