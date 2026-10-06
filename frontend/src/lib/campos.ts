export const ETIQUETA_CAMPO: Record<string, any> = {
  intencion: "Intención",
  publico: "Público",
  mensaje: "Mensaje",
  tono: "Tono",
  premisa: "Premisa",
  mundo: "Mundo",
  arco_general: "Arco general",
  notas: "Tu idea, tal cual",
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
  arco_general: "Hacia dónde evoluciona la historia.",
};

export const CAMPOS_POR_TIPO: Record<string, any> = {
  corto: ["notas", "intencion", "premisa", "tono", "mundo"],
  anuncio: ["notas", "intencion", "mensaje", "publico", "tono"],
  imagen: ["notas", "intencion", "tono"],
  serie: ["notas", "premisa", "arco_general", "tono", "mundo"],
};

export const REQUERIDOS: Record<string, any> = {
  corto: ["intencion", "premisa"],
  anuncio: ["intencion", "mensaje"],
  imagen: ["intencion"],
  serie: ["premisa", "arco_general"],
};

export const ES_AREA = new Set(["intencion", "premisa", "mensaje", "mundo", "arco_general", "notas"]);
