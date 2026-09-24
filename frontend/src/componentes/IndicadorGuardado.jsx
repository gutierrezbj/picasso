import React from "react";
import { useGuardado } from "../estado/GuardadoContext";

// Indicador de guardado (§12). Tres estados de texto. Un fallo nunca se ve como éxito.
export default function IndicadorGuardado() {
  const { estado, reintentar } = useGuardado();
  if (estado === "inactivo") return null;

  if (estado === "guardando") {
    return (
      <span data-testid="indicador-guardado" className="text-[13px] leading-[18px] text-tinta2">
        Guardando…
      </span>
    );
  }
  if (estado === "guardado") {
    return (
      <span data-testid="indicador-guardado" className="text-[13px] leading-[18px] text-exito">
        Guardado
      </span>
    );
  }
  return (
    <span data-testid="indicador-guardado" className="flex items-center gap-2 text-[13px] leading-[18px] text-acentoTinta">
      No se ha podido guardar
      <button
        data-testid="reintentar-guardado"
        onClick={reintentar}
        className="underline underline-offset-2 hover:text-acento focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
      >
        Reintentar
      </button>
    </span>
  );
}
