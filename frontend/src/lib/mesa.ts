export interface NodoArbol {
  id: string;
  origen: string | null;
  creado: string;
}

export interface Punto {
  x: number;
  y: number;
}

export const ANCHO_TARJETA = 172;
export const ALTO_TARJETA = 262;
export const SEPARACION_X = 168;
export const SEPARACION_Y = 30;

export function compararNodos(a: NodoArbol, b: NodoArbol): number {
  if (a.creado !== b.creado) return a.creado < b.creado ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function colocar(nodos: NodoArbol[]): Record<string, Punto> {
  const ids = new Set(nodos.map((n) => n.id));
  const hijos = new Map<string, NodoArbol[]>();
  const raices: NodoArbol[] = [];
  for (const n of nodos) {
    if (n.origen && ids.has(n.origen) && n.origen !== n.id) {
      const lista = hijos.get(n.origen) || [];
      lista.push(n);
      hijos.set(n.origen, lista);
    } else {
      raices.push(n);
    }
  }
  raices.sort(compararNodos);
  hijos.forEach((lista) => lista.sort(compararNodos));

  const posiciones: Record<string, Punto> = {};
  const vistos = new Set<string>();
  let fila = 0;
  const visitar = (n: NodoArbol, profundidad: number) => {
    if (vistos.has(n.id)) return;
    vistos.add(n.id);
    const x = profundidad * (ANCHO_TARJETA + SEPARACION_X);
    const propios = (hijos.get(n.id) || []).filter((h) => !vistos.has(h.id));
    if (!propios.length) {
      posiciones[n.id] = { x, y: fila * (ALTO_TARJETA + SEPARACION_Y) };
      fila += 1;
      return;
    }
    propios.forEach((h) => visitar(h, profundidad + 1));
    const primero = propios.find((h) => posiciones[h.id]);
    posiciones[n.id] = { x, y: primero ? posiciones[primero.id].y : fila * (ALTO_TARJETA + SEPARACION_Y) };
  };
  raices.forEach((r) => visitar(r, 0));
  nodos.filter((n) => !vistos.has(n.id)).sort(compararNodos).forEach((n) => visitar(n, 0));
  return posiciones;
}

export function linaje<T extends { id: string; origen_toma_id?: string | null }>(id: string, todos: T[]): T[] {
  const porId = new Map(todos.map((t) => [t.id, t]));
  const cadena: T[] = [];
  const vistos = new Set<string>();
  let actual = porId.get(id);
  while (actual && !vistos.has(actual.id)) {
    vistos.add(actual.id);
    cadena.unshift(actual);
    actual = actual.origen_toma_id ? porId.get(actual.origen_toma_id) : undefined;
  }
  return cadena;
}

export function recortar(texto: string, maximo: number): string {
  const limpio = (texto || "").replace(/\s+/g, " ").trim();
  return limpio.length > maximo ? limpio.slice(0, maximo - 1).trimEnd() + "…" : limpio;
}
