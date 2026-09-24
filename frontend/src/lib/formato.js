const SIMBOLOS = { USD: "$", EUR: "€", GBP: "£", MXN: "$", ARS: "$" };

export function simboloMoneda(moneda) {
  return SIMBOLOS[moneda] || moneda;
}

// Formato español: coma decimal, símbolo detrás. Ej: "0,00 $"
export function formatoMoneda(valor, moneda) {
  const n = Number(valor || 0).toFixed(2).replace(".", ",");
  return `${n} ${simboloMoneda(moneda)}`;
}

export const NOMBRE_TIPO = {
  corto: "Corto",
  anuncio: "Anuncio",
  imagen: "Imagen",
  serie: "Serie",
};

export const NOMBRE_TIPO_ESPACIO = {
  cliente: "Cliente",
  marca: "Marca",
  propio: "Trabajo propio",
};
