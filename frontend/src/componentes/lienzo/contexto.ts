import { createContext, useContext } from "react";

// Acciones del lienzo disponibles en las tarjetas, sin recrear los nodos.
export interface AccionesLienzo {
  plegados: string[];
  alternarPlegado: (escenaId: string) => void;
  anadirPlano: (escenaId: string) => void;
  abrirGuionGrafico: (escenaId: string) => void;
  verEnGuion: () => void;
  abrirFicha: (nodoId: string, pestana?: "direccion" | "producir" | "tomas") => void;
  moverAEscena: (planoId: string, escenaId: string) => void;
  escenas: { id: string; titulo: string }[];
  moverPlano: (planoId: string, direccion: "antes" | "despues") => void;
  duplicarPlano: (planoId: string) => void;
  dividirPlano: (planoId: string) => void;
  borrarPlano: (planoId: string) => void;
  urlMedio: (medioId: string) => string;
}

export const ContextoLienzo = createContext<AccionesLienzo | null>(null);

export function useAccionesLienzo(): AccionesLienzo {
  const ctx = useContext(ContextoLienzo);
  if (!ctx) throw new Error("useAccionesLienzo fuera del lienzo");
  return ctx;
}
