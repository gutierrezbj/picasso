import React from "react";
import { X } from "lucide-react";

interface PropsFichaContextual {
  titulo: string;
  subtitulo?: string;
  posicion: { x: number; y: number };
  onCerrar: () => void;
  ancho?: number;
  testid?: string;
  children: React.ReactNode;
}

// Ficha contextual (§7.3): se abre junto a la tarjeta, sin mover el encuadre. Si no
// cabe se recoloca; en pantallas estrechas pasa a una bandeja inferior.
export default function FichaContextual({
  titulo,
  subtitulo,
  posicion,
  onCerrar,
  ancho = 380,
  testid = "ficha-contextual",
  children,
}: PropsFichaContextual) {
  const estrecha = typeof window !== "undefined" && window.innerWidth < 760;
  const margen = 16;
  const maxIzq = (typeof window !== "undefined" ? window.innerWidth : 1200) - ancho - margen;
  const izquierda = Math.max(margen, Math.min(posicion.x, maxIzq));
  const arriba = Math.max(
    margen + 56,
    Math.min(posicion.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 260)
  );

  const estilo: React.CSSProperties = estrecha
    ? { left: 0, right: 0, bottom: 0, width: "100%", maxHeight: "60vh" }
    : { left: izquierda, top: arriba, width: ancho, maxHeight: "calc(100vh - 140px)" };

  return (
    <aside
      data-testid={testid}
      role="dialog"
      aria-label={titulo}
      style={estilo}
      className="fixed z-40 overflow-auto rounded-panel border border-linea bg-superficie p-5 shadow-context"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] leading-[24px] font-semibold text-tinta">{titulo}</h2>
          {subtitulo && <p className="text-[13px] leading-[18px] text-tinta2">{subtitulo}</p>}
        </div>
        <button
          data-testid="cerrar-ficha-contextual"
          onClick={onCerrar}
          aria-label="Cerrar ficha"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <X size={18} strokeWidth={1.9} />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </aside>
  );
}
