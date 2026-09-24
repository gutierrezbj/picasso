import { useEffect, useRef } from "react";
import { useGuardado } from "./GuardadoContext";

// Autoguardado con debounce (§12). Guardando… → Guardado, o error con Reintentar.
export function useAutoguardado(valor, guardarFn, { activo = true, ms = 800 } = {}) {
  const g = useGuardado();
  const primero = useRef(true);
  const guardarRef = useRef(guardarFn);
  guardarRef.current = guardarFn;

  useEffect(() => {
    if (!activo) return undefined;
    if (primero.current) {
      primero.current = false;
      return undefined;
    }
    g.guardando();
    const t = setTimeout(() => {
      const ejecutar = async () => {
        try {
          await guardarRef.current();
          g.guardado();
        } catch (e) {
          g.error(ejecutar);
        }
      };
      ejecutar();
    }, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [JSON.stringify(valor), activo]);
}
