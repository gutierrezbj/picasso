import { useEffect, useRef } from "react";
import { useGuardado, type AccionesConflicto } from "./GuardadoContext";

interface Opciones extends AccionesConflicto {
  activo?: boolean;
  ms?: number;
}

// Autoguardado con debounce (§12). Guardando… → Guardado, error con Reintentar o,
// si el servidor responde 409, conflicto con Recargar / Sobrescribir.
export function useAutoguardado(
  valor: unknown,
  guardarFn: () => Promise<unknown>,
  { activo = true, ms = 800, recargar, sobrescribir }: Opciones = {}
) {
  const g = useGuardado();
  const primero = useRef(true);
  const guardarRef = useRef(guardarFn);
  guardarRef.current = guardarFn;
  const conflictoRef = useRef<AccionesConflicto>({ recargar, sobrescribir });
  conflictoRef.current = { recargar, sobrescribir };

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
        } catch (e: any) {
          const acc = conflictoRef.current;
          if (e?.status === 409 && (acc.recargar || acc.sobrescribir)) g.conflicto(acc);
          else g.error(ejecutar);
        }
      };
      ejecutar();
    }, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [JSON.stringify(valor), activo]);
}
