import React from "react";
import { CheckCircle2, CircleDot, Clock, Lock, MinusCircle } from "lucide-react";

// Selección, versión y estado se distinguen por texto/forma/icono, no solo color (§22).
const MAPA = {
  listo: { texto: "Listo", Icono: CheckCircle2, color: "var(--color-exito)" },
  en_curso: { texto: "En curso", Icono: CircleDot, color: "var(--color-acento)" },
  pendiente: { texto: "Pendiente", Icono: Clock, color: "var(--color-tinta-2)" },
  bloqueado: { texto: "Bloqueado", Icono: Lock, color: "var(--color-tinta-2)" },
  no_hace_falta: { texto: "No hace falta", Icono: MinusCircle, color: "var(--color-tinta-2)" },
};

export default function EstadoPaso({ estado, className = "" }) {
  const info = MAPA[estado] || MAPA.pendiente;
  const { Icono } = info;
  return (
    <span
      data-testid={`estado-${estado}`}
      className={`inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-medium ${className}`}
      style={{ color: info.color }}
    >
      <Icono size={16} strokeWidth={1.9} aria-hidden />
      {info.texto}
    </span>
  );
}
