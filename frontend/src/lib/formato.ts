const SIMBOLOS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", MXN: "$", ARS: "$" };

export function simboloMoneda(moneda: string): string {
  return SIMBOLOS[moneda] || moneda;
}

// Formato español: coma decimal, símbolo detrás. Ej: "0,00 $"
export function formatoMoneda(valor: number | null | undefined, moneda: string): string {
  const n = Number(valor || 0).toFixed(2).replace(".", ",");
  return `${n} ${simboloMoneda(moneda)}`;
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
