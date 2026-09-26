import type { Node, Edge } from "@xyflow/react";
import type { EscenaConPlanos, LayoutLienzo, Plano, Posicion, RepartoLienzo } from "../tipos";

// Ids de nodo estables: la posición se guarda por id (§7.5).
export const idElemento = (repartoId: string) => `el:${repartoId}`;
export const idEscena = (escenaId: string) => `esc:${escenaId}`;
export const idPlano = (planoId: string) => `pl:${planoId}`;

export const ANCHO_ELEMENTO = 220;
export const ANCHO_ESCENA = 260;
export const ANCHO_PLANO = 230;

const COL_ESCENAS = 300;
const ALTO_FILA = 360;
const SALTO_ELEMENTO = 250;
const COL_ELEMENTOS = 24;

export interface DatosElemento {
  entrada: RepartoLienzo;
  [clave: string]: unknown;
}

export interface DatosEscena {
  escenaId: string;
  titulo: string;
  resumen: string;
  numPlanos: number;
  orden: number;
  [clave: string]: unknown;
}

export interface DatosPlano {
  plano: Plano;
  etiqueta: string;
  [clave: string]: unknown;
}

export type NodoLienzo =
  | Node<DatosElemento, "elemento">
  | Node<DatosEscena, "escena">
  | Node<DatosPlano, "plano">;

/** Disposición automática (§7.1). Solo se usa para los nodos que aún no tienen
 * posición guardada: después manda el LayoutLienzo. */
export function posicionAutomatica(
  nodoId: string,
  reparto: RepartoLienzo[],
  escenas: EscenaConPlanos[]
): Posicion {
  const iEl = reparto.findIndex((r) => idElemento(r.id) === nodoId);
  if (iEl >= 0) return { x: COL_ELEMENTOS, y: 40 + iEl * SALTO_ELEMENTO };
  const iEsc = escenas.findIndex((e) => idEscena(e.escena.id) === nodoId);
  if (iEsc >= 0) return { x: COL_ESCENAS, y: 40 + iEsc * ALTO_FILA };
  for (let i = 0; i < escenas.length; i += 1) {
    const j = escenas[i].planos.findIndex((p) => idPlano(p.id) === nodoId);
    if (j >= 0) {
      return { x: COL_ESCENAS + ANCHO_ESCENA + 40 + j * (ANCHO_PLANO + 30), y: 40 + i * ALTO_FILA };
    }
  }
  return { x: COL_ESCENAS, y: 40 + escenas.length * ALTO_FILA };
}

export function construirNodos(
  vista: { reparto: RepartoLienzo[]; escenas: EscenaConPlanos[]; planos_sin_escena?: Plano[] },
  layout: LayoutLienzo,
  seleccion: string[]
): NodoLienzo[] {
  const { reparto, escenas } = vista;
  const pos = (id: string): Posicion =>
    layout.posiciones[id] || posicionAutomatica(id, reparto, escenas);
  const nodos: NodoLienzo[] = [];

  reparto.forEach((entrada) => {
    const id = idElemento(entrada.id);
    nodos.push({
      id,
      type: "elemento",
      position: pos(id),
      data: { entrada },
      selected: seleccion.includes(id),
    });
  });

  escenas.forEach(({ escena, planos }, indice) => {
    const id = idEscena(escena.id);
    nodos.push({
      id,
      type: "escena",
      position: pos(id),
      data: {
        escenaId: escena.id,
        titulo: escena.titulo || "Escena sin título",
        resumen: escena.que_ocurre || "",
        numPlanos: planos.length,
        orden: indice + 1,
      },
      selected: seleccion.includes(id),
    });
    if (layout.grupos_plegados.includes(escena.id)) return;
    planos.forEach((plano, j) => {
      const pid = idPlano(plano.id);
      nodos.push({
        id: pid,
        type: "plano",
        position: pos(pid),
        data: { plano, etiqueta: `E${indice + 1}·P${j + 1}` },
        selected: seleccion.includes(pid),
      });
    });
  });

  // Fila de los planos sin escena, al final del lienzo (§13).
  (vista.planos_sin_escena || []).forEach((plano, j) => {
    const pid = idPlano(plano.id);
    nodos.push({
      id: pid,
      type: "plano",
      position:
        layout.posiciones[pid] || {
          x: COL_ESCENAS + ANCHO_ESCENA + 40 + j * (ANCHO_PLANO + 30),
          y: 40 + escenas.length * ALTO_FILA,
        },
      data: { plano, etiqueta: `SE·P${j + 1}` },
      selected: seleccion.includes(pid),
    });
  });

  return nodos;
}

export function construirConexiones(
  vista: { reparto: RepartoLienzo[]; escenas: EscenaConPlanos[] },
  layout: LayoutLienzo
): Edge[] {
  if (!layout.mostrar_conexiones_reparto) return [];
  const aristas: Edge[] = [];
  vista.escenas.forEach(({ escena, planos }) => {
    if (layout.grupos_plegados.includes(escena.id)) return;
    planos.forEach((plano) => {
      plano.elementos.forEach((repartoId) => {
        if (!vista.reparto.some((r) => r.id === repartoId)) return;
        aristas.push({
          id: `${repartoId}->${plano.id}`,
          source: idElemento(repartoId),
          target: idPlano(plano.id),
          style: { stroke: "var(--color-linea-fuerte, #b9c6c4)" },
        });
      });
    });
  });
  return aristas;
}
