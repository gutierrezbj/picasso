import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface AccionesConflicto {
  recargar?: () => void | Promise<unknown>;
  sobrescribir?: () => void | Promise<unknown>;
}

interface ValorGuardado {
  estado: "inactivo" | "guardando" | "guardado" | "error" | "conflicto";
  guardando: () => void;
  guardado: () => void;
  error: (accionReintentar?: () => void) => void;
  conflicto: (acciones: AccionesConflicto) => void;
  reintentar: () => void;
  acciones: AccionesConflicto | null;
}

const GuardadoContext = createContext<ValorGuardado | null>(null);

export function GuardadoProvider({ children }: { children?: React.ReactNode }) {
  // estado: inactivo | guardando | guardado | error | conflicto
  const [estado, setEstado] = useState<ValorGuardado["estado"]>("inactivo");
  const [acciones, setAcciones] = useState<AccionesConflicto | null>(null);
  const reintentarRef = useRef<(() => void) | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardando = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setEstado("guardando");
  }, []);

  const guardado = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setAcciones(null);
    setEstado("guardado");
  }, []);

  const error = useCallback((accionReintentar?: () => void) => {
    reintentarRef.current = accionReintentar || null;
    setEstado("error");
  }, []);

  // Conflicto de versión (§12): el servidor ha rechazado con 409. No se pierde
  // nada en silencio: se ofrece recargar o sobrescribir.
  const conflicto = useCallback((acc: AccionesConflicto) => {
    setAcciones(acc);
    setEstado("conflicto");
  }, []);

  const reintentar = useCallback(() => {
    if (reintentarRef.current) reintentarRef.current();
  }, []);

  return (
    <GuardadoContext.Provider
      value={{ estado, guardando, guardado, error, conflicto, reintentar, acciones }}
    >
      {children}
    </GuardadoContext.Provider>
  );
}

export function useGuardado() {
  const ctx = useContext(GuardadoContext);
  if (!ctx) throw new Error("useGuardado fuera de GuardadoProvider");
  return ctx;
}
