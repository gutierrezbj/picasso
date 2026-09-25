// Tipos del dominio (§3.1 del documento maestro). Se usan en la capa de API.

export type TipoProyecto = "corto" | "anuncio" | "imagen" | "serie";
export type TipoEspacio = "cliente" | "marca" | "propio";
export type ClaseElemento = "personaje" | "objeto" | "producto" | "escenario";
export type ClaseMedio = "imagen" | "video" | "audio" | "documento";
export type EstadoPasoValor = "listo" | "en_curso" | "pendiente" | "bloqueado" | "no_hace_falta";
export type MarcaRevision = "solo_texto" | "afecta_planos";

export interface Espacio {
  id: string;
  nombre: string;
  tipo_espacio: TipoEspacio;
  notas_de_marca: string | null;
  logo_id: string | null;
  portada_id: string | null;
  num_proyectos?: number;
  num_en_curso?: number;
  created_at: string;
  updated_at: string;
}

export interface Proyecto {
  id: string;
  espacio_id: string;
  nombre: string;
  tipo: TipoProyecto;
  formato_id: string | null;
  formato_video: string;
  duracion_objetivo_s: number | null;
  presupuesto_max: number | null;
  pasos_omitidos: string[];
  ultimo_acceso: string;
  ultima_ubicacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paso {
  clave: string;
  nombre: string;
  pantalla: string;
  construye: string;
  listo_cuando: string;
  estado: EstadoPasoValor;
  obligatorio: boolean;
  fase: number;
  clase?: ClaseElemento | null;
  campo_desarrollo?: string | null;
  requiere_referencia?: boolean;
}

export interface Recorrido {
  tipo: TipoProyecto;
  nombre?: string;
  descripcion?: string;
  pasos: Paso[];
}

export interface VistaProyecto {
  proyecto: Proyecto;
  espacio: Espacio | null;
  recorrido: Recorrido;
  gasto: number;
  moneda: string;
}

export interface Desarrollo {
  intencion: string | null;
  publico: string | null;
  mensaje: string | null;
  tono: string | null;
  premisa: string | null;
  mundo: string | null;
  arco_general: string | null;
  notas: string | null;
  respuestas_formato: Record<string, string | null>;
  estado: "en_curso" | "listo";
  updated_at?: string;
}

export interface Medio {
  id: string;
  espacio_id: string;
  clase: ClaseMedio;
  nombre_original: string | null;
  mime: string;
  ancho: number | null;
  alto: number | null;
  created_at: string;
  updated_at: string;
}

export interface Referencia {
  medio_id: string;
  rol: string;
}

export interface FichaVersion {
  id: string;
  elemento_id: string;
  version: number;
  estado: "borrador" | "aprobada";
  descripcion: string | null;
  rasgos_fijos: string[];
  rasgos_variables: string[];
  referencias: Referencia[];
  updated_at: string;
  [extra: string]: unknown;
}

export interface Elemento {
  id: string;
  espacio_id: string;
  clase: ClaseElemento;
  nombre: string;
  fichas: FichaVersion[];
  ficha?: FichaVersion | null;
  ficha_vigente?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EntradaReparto {
  id: string;
  proyecto_id: string;
  elemento_id: string;
  version_ficha: number;
  papel: string | null;
  elemento: Elemento;
  fichas: FichaVersion[];
  ficha: FichaVersion | null;
  hay_version_nueva: number | null;
  ultima_aprobada: number | null;
  updated_at: string;
}

export interface Pieza {
  id: string;
  proyecto_id: string;
  numero: number | null;
  titulo: string | null;
  de_que_va: string | null;
  updated_at: string;
}

export interface Dialogo {
  hablante: string; // "narrador" | elemento_id (personaje de la escena)
  texto: string;
}

export interface Escena {
  id: string;
  guion_id: string;
  orden: number;
  borrador: boolean;
  origen_id: string | null;
  titulo: string;
  que_ocurre: string;
  que_se_ve: string;
  intencion: string;
  elementos: string[]; // ids del reparto
  dialogos: Dialogo[];
  sonido_previsto: string | null;
  duracion_orientativa_s: number | null;
  created_at: string;
  updated_at: string;
}

export interface Encargo {
  que_se_muestra: string | null;
  composicion: string | null;
  intencion: string | null;
  elementos: string[];
  referencias: string[];
  numero_imagenes: number;
}

export interface Guion {
  id: string;
  pieza_id: string;
  clase: "escenas" | "encargo";
  estado: "borrador" | "aprobado";
  aprobado_en: string | null;
  revision: number;
  revision_en_curso: { creada_en: string } | null;
  encargo?: Encargo | null;
  historial_revisiones?: unknown[];
}

export interface CampoDiferencia {
  campo: string;
  etiqueta: string;
  antes: unknown;
  despues: unknown;
}

export interface Diferencias {
  anadidas: { escena_id: string; titulo: string; orden: number }[];
  editadas: { escena_id: string; titulo: string; campos: CampoDiferencia[] }[];
  eliminadas: { escena_id: string; titulo: string; orden: number }[];
  reordenadas: { escena_id: string; titulo: string; de: number; a: number }[];
  hay_cambios: boolean;
  encargo?: { campos: CampoDiferencia[]; hay_cambios: boolean };
}

export interface VistaGuion {
  guion: Guion;
  escenas: Escena[];
  escenas_aprobadas: Escena[];
  encargo: Encargo | null;
  hay_revision_en_curso: boolean;
  diferencias: Diferencias | null;
  falta_para_aprobar: string[];
}

export interface Ajustes {
  moneda: string;
  presupuesto_por_defecto: number;
  modelo_asistente: string;
  updated_at?: string;
}

export interface Entorno {
  db_name: string;
  es_pruebas: boolean;
}
