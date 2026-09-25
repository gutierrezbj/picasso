import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import IndicadorGuardado from "./IndicadorGuardado";
import { formatoMoneda } from "../lib/formato";

// Cabecera fija (§5.3). Ubicación pulsable, indicador de guardado y, dentro de un
// proyecto, el gasto (siempre visible aunque sea 0 — precisión del usuario).
interface Miga {
  texto: string;
  a?: string;
}

interface Props {
  migas?: Miga[];
  gasto?: number | null;
  moneda?: string;
}

export default function Cabecera({ migas = [], gasto = null, moneda = "USD" }: Props) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-linea bg-superficie/90 px-6 backdrop-blur"
      style={{ minHeight: "var(--header-height)" }}
    >
      <nav aria-label="Ubicación" className="flex items-center gap-1 text-[14px] leading-[20px] min-w-0">
        {migas.map((m, i) => {
          const ultimo = i === migas.length - 1;
          return (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <span className="text-tinta3">/</span>}
              {m.a && !ultimo ? (
                <Link
                  to={m.a}
                  data-testid={`miga-${i}`}
                  className="truncate rounded px-1 text-tinta2 hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  {m.texto}
                </Link>
              ) : (
                <span
                  data-testid={`miga-${i}`}
                  className={`truncate px-1 ${ultimo ? "font-semibold text-tinta" : "text-tinta2"}`}
                >
                  {m.texto}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-5 shrink-0">
        <IndicadorGuardado />
        {gasto !== null && (
          <span data-testid="indicador-gasto" className="tabular text-[14px] leading-[20px] text-tinta2">
            Gasto: {formatoMoneda(gasto, moneda)}
          </span>
        )}
        <Link
          to="/ajustes"
          data-testid="acceso-ajustes"
          aria-label="Ajustes"
          className="flex h-11 w-11 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Settings size={20} strokeWidth={1.9} />
        </Link>
      </div>
    </header>
  );
}
