import React from "react";
import { useGuardado } from "../estado/GuardadoContext";

// Indicador de guardado (§12). Un fallo nunca se ve como éxito. En un conflicto de
// versión (409) se ofrece recargar o sobrescribir; lo escrito no se pierde solo.
export default function IndicadorGuardado() {
  const { estado, reintentar, acciones } = useGuardado();
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
  if (estado === "conflicto") {
    return (
      <span
        data-testid="indicador-guardado"
        className="flex flex-wrap items-center gap-2 text-[13px] leading-[18px] text-aviso"
      >
        Se ha modificado en otro sitio
        {acciones?.recargar && (
          <button
            data-testid="conflicto-recargar"
            onClick={() => acciones.recargar?.()}
            className="underline underline-offset-2 hover:text-acento focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            Recargar
          </button>
        )}
        {acciones?.sobrescribir && (
          <button
            data-testid="conflicto-sobrescribir"
            onClick={() => acciones.sobrescribir?.()}
            className="underline underline-offset-2 hover:text-acento focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            Sobrescribir
          </button>
        )}
      </span>
    );
  }
  return (
    <span data-testid="indicador-guardado" className="flex items-center gap-2 text-[13px] leading-[18px] text-error">
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
