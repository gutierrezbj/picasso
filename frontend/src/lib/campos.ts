export const ETIQUETA_CAMPO: Record<string, any> = {
  intencion: "Intención",
  publico: "Público",
  mensaje: "Mensaje",
  tono: "Tono",
  premisa: "Premisa",
  mundo: "Mundo",
  arco_general: "Arco general",
  notas: "Notas",
  titulo: "Título",
  que_ocurre: "Qué ocurre",
  que_se_ve: "Qué se ve",
  sonido_previsto: "Sonido previsto",
};

export const AYUDA_CAMPO: Record<string, any> = {
  intencion: "Qué quieres conseguir o contar.",
  premisa: "La idea en una o dos frases.",
  mensaje: "Qué debe quedar claro a quien lo ve.",
  publico: "A quién va dirigido.",
  arco_general: "Hacia dónde evoluciona la historia.",
};

export const CAMPOS_POR_TIPO: Record<string, any> = {
  corto: ["intencion", "premisa", "tono", "mundo", "notas"],
  anuncio: ["intencion", "mensaje", "publico", "tono", "notas"],
  imagen: ["intencion", "tono", "notas"],
  serie: ["premisa", "arco_general", "tono", "mundo", "notas"],
};

export const REQUERIDOS: Record<string, any> = {
  corto: ["intencion", "premisa"],
  anuncio: ["intencion", "mensaje"],
  imagen: ["intencion"],
  serie: ["premisa", "arco_general"],
};

export const ES_AREA = new Set(["intencion", "premisa", "mensaje", "mundo", "arco_general", "notas"]);
