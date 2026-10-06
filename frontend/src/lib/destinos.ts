export const DESTINOS: { valor: string; texto: string; formato: string | null }[] = [
  { valor: "reels", texto: "Reels, TikTok o Shorts", formato: "9:16" },
  { valor: "feed", texto: "Feed de Instagram o Facebook", formato: "4:5" },
  { valor: "web", texto: "YouTube o web", formato: "16:9" },
  { valor: "presentacion", texto: "Presentación o pantalla", formato: "16:9" },
  { valor: "cine", texto: "Cine o festival", formato: "16:9" },
  { valor: "cuadrado", texto: "Varias plataformas (cuadrado)", formato: "1:1" },
  { valor: "otro", texto: "Otro", formato: null },
];

export const FORMATOS = [
  { valor: "16:9", texto: "16:9 · horizontal" },
  { valor: "9:16", texto: "9:16 · vertical" },
  { valor: "4:5", texto: "4:5 · retrato" },
  { valor: "1:1", texto: "1:1 · cuadrado" },
];
