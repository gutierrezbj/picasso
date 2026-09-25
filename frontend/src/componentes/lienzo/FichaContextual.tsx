import React from "react";
import { X } from "lucide-react";

interface PropsFichaContextual {
  titulo: string;
  subtitulo?: string;
  // Rectángulo en pantalla de la tarjeta que abre la ficha: nunca se tapa (§7.3).
  tarjeta: { izquierda: number; derecha: number; arriba: number };
  onCerrar: () => void;
  ancho?: number;
  testid?: string;
  children: React.ReactNode;
}

const MARGEN = 16;

export default function FichaContextual({
  titulo,
  subtitulo,
  tarjeta,
  onCerrar,
  ancho = 380,
  testid = "ficha-contextual",
  children,
}: PropsFichaContextual) {
  const anchoVentana = typeof window !== "undefined" ? window.innerWidth : 1440;
  const altoVentana = typeof window !== "undefined" ? window.innerHeight : 900;

  const cabeDerecha = tarjeta.derecha + MARGEN + ancho <= anchoVentana - MARGEN;
  const cabeIzquierda = tarjeta.izquierda - MARGEN - ancho >= MARGEN;
  const lado = cabeDerecha ? "derecha" : cabeIzquierda ? "izquierda" : "bandeja";

  const estilo: React.CSSProperties =
    lado === "bandeja"
      ? { left: 0, right: 0, bottom: 0, width: "100%", maxHeight: "60vh" }
      : {
          left: lado === "derecha" ? tarjeta.derecha + MARGEN : tarjeta.izquierda - MARGEN - ancho,
          top: Math.max(MARGEN + 56, Math.min(tarjeta.arriba, altoVentana - 260)),
          width: ancho,
          maxHeight: "calc(100vh - 140px)",
        };

  return (
    <aside
      data-testid={testid}
      data-lado={lado}
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
