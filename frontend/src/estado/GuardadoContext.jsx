import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const GuardadoContext = createContext(null);

export function GuardadoProvider({ children }) {
  // estado: inactivo | guardando | guardado | error
  const [estado, setEstado] = useState("inactivo");
  const reintentarRef = useRef(null);
  const temporizador = useRef(null);

  const guardando = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setEstado("guardando");
  }, []);

  const guardado = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setEstado("guardado");
  }, []);

  const error = useCallback((accionReintentar) => {
    reintentarRef.current = accionReintentar || null;
    setEstado("error");
  }, []);

  const reintentar = useCallback(() => {
    if (reintentarRef.current) reintentarRef.current();
  }, []);

  return (
    <GuardadoContext.Provider value={{ estado, guardando, guardado, error, reintentar }}>
      {children}
    </GuardadoContext.Provider>
  );
}

export function useGuardado() {
  const ctx = useContext(GuardadoContext);
  if (!ctx) throw new Error("useGuardado fuera de GuardadoProvider");
  return ctx;
}
