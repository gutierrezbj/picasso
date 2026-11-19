const SIMBOLOS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", MXN: "$", ARS: "$" };

export function simboloMoneda(moneda: string): string {
  return SIMBOLOS[moneda] || moneda;
}

// Formato español: coma decimal, símbolo detrás. Ej: "0,20 $", "0,0032 $"
export function formatoMoneda(valor: number | null | undefined, moneda: string): string {
  const n = Number(valor || 0).toFixed(4).replace(/0{1,2}$/, "").replace(".", ",");
  return `${n} ${simboloMoneda(moneda)}`;
}

export function formatoMonedaFino(valor: number | null | undefined, moneda: string): string {
  const n = Number(valor || 0).toFixed(4).replace(".", ",");
  return `${n} ${simboloMoneda(moneda)}`;
}

/** «Corto · 16:9 · 25 fps»: qué es el proyecto, visible en la cabecera. */
export function resumenProyecto(p: { tipo: string; formato_video: string; fps?: number }): string {
  const partes = [NOMBRE_TIPO[p.tipo] || p.tipo, p.formato_video];
  if (p.tipo !== "imagen") partes.push(`${p.fps || 25} fps`);
  return partes.join(" · ");
}

export const NOMBRE_TIPO: Record<string, string> = {
  corto: "Corto",
  anuncio: "Anuncio",
  imagen: "Imagen",
  serie: "Serie",
};

export const NOMBRE_TIPO_ESPACIO: Record<string, string> = {
  cliente: "Cliente",
  marca: "Marca",
  propio: "Trabajo propio",
};
