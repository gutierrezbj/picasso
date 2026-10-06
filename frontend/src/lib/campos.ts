export const ETIQUETA_CAMPO: Record<string, any> = {
  intencion: "Intención",
  publico: "Público",
  mensaje: "Mensaje",
  tono: "Tono",
  premisa: "Premisa",
  mundo: "Mundo",
  arco_general: "Arco general",
  notas: "Tu idea, tal cual",
  que_evitar: "Qué evitar",
  destino_detalle: "Concretando",
  titulo: "Título",
  que_ocurre: "Qué ocurre",
  que_se_ve: "Qué se ve",
  sonido_previsto: "Sonido previsto",
};

export const AYUDA_CAMPO: Record<string, any> = {
  notas: "Escribe lo que tienes en la cabeza, sin ordenar. Después lo repartes en los campos de abajo, o te ayuda el asistente con «Ordenar mis notas».",
  intencion: "Qué quieres conseguir o contar.",
  premisa: "La idea en una o dos frases.",
  mensaje: "Qué debe quedar claro a quien lo ve.",
  publico: "A quién va dirigido.",
  que_evitar: "Estilos, tonos o recursos que no quieres. Se añade a lo que se le pide evitar a cada plano.",
  tono: "Una o dos palabras.",
  arco_general: "Hacia dónde evoluciona la historia.",
};

export const IDEA_ORDENADA: Record<string, string[]> = {
  corto: ["premisa", "mundo"],
  anuncio: ["mensaje"],
  imagen: [],
  serie: ["premisa", "arco_general", "mundo"],
};

export const PROVOCAR = ["intencion", "tono", "que_evitar"];

export const CAMPOS_POR_TIPO: Record<string, any> = {
  corto: ["notas", "intencion", "premisa", "tono", "mundo", "publico", "que_evitar"],
  anuncio: ["notas", "intencion", "mensaje", "publico", "tono", "que_evitar"],
  imagen: ["notas", "intencion", "tono", "publico", "que_evitar"],
  serie: ["notas", "premisa", "arco_general", "tono", "mundo", "publico", "que_evitar"],
};

export const REQUERIDOS: Record<string, any> = {
  corto: ["destino", "notas", "intencion", "premisa"],
  anuncio: ["destino", "notas", "intencion", "mensaje"],
  imagen: ["destino", "notas", "intencion"],
  serie: ["destino", "notas", "premisa", "arco_general"],
};

export const ES_AREA = new Set(["intencion", "premisa", "mensaje", "mundo", "arco_general", "notas", "que_evitar"]);
