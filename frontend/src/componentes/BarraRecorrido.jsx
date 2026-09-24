import React from "react";
import { useNavigate } from "react-router-dom";
import EstadoPaso from "./EstadoPaso";
import { rutaPaso } from "../lib/rutas";

// Barra del recorrido (§5.3): los pasos del tipo en orden, con su estado.
// El paso actual se distingue. Un paso bloqueado se ve y, al pulsarlo, lleva a él.
export default function BarraRecorrido({ proyectoId, recorrido }) {
  const navegar = useNavigate();
  const { pasos, paso_actual } = recorrido;

  return (
    <div className="border-b border-linea bg-superficie2 px-6 py-3" data-testid="barra-recorrido">
      <ol className="flex flex-wrap items-stretch gap-2">
        {pasos.map((p, i) => {
          const actual = p.clave === paso_actual;
          return (
            <li key={p.clave} className="flex items-center gap-2">
              <button
                data-testid={`paso-${p.clave}`}
                onClick={() => navegar(rutaPaso(proyectoId, p))}
                className={
                  "flex flex-col items-start gap-1 rounded-control px-3 py-2 text-left transition-colors duration-[120ms] ease-suave " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento hover:bg-superficie " +
                  (actual ? "bg-superficie ring-2 ring-acento" : "border border-transparent")
                }
              >
                <span
                  className={
                    "text-[14px] leading-[20px] " + (actual ? "font-semibold text-tinta" : "text-tinta2")
                  }
                >
                  {p.nombre}
                </span>
                <EstadoPaso estado={p.estado} />
              </button>
              {i < pasos.length - 1 && <span className="text-tinta3" aria-hidden>›</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
