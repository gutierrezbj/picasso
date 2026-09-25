import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Boton from "./Boton";
import { rutaPaso } from "../lib/rutas";
import type { Paso } from "../tipos";

interface PropsSiguientePaso {
  proyectoId: string;
  paso: Paso;
  siguiente: Paso | null;
}

// Bloque "Siguiente paso" (§5.3) al pie de cada paso: qué falta para darlo por listo
// y el botón para continuar. El criterio de «paso superado» lo calcula el backend
// (dominio/estado.py + recorridos.calcular): aquí solo se lee `paso.superado`.
export default function SiguientePaso({ proyectoId, paso, siguiente }: PropsSiguientePaso) {
  const navegar = useNavigate();
  const superado = paso.superado;

  return (
    <section
      data-testid="bloque-siguiente-paso"
      className="mt-12 rounded-panel border border-linea bg-superficie2 p-6"
    >
      <h2 className="text-[16px] leading-[24px] font-semibold text-tinta">
        Siguiente paso
      </h2>
      <p className="mt-3 text-[16px] leading-[24px] text-tinta">
        {paso.estado === "no_hace_falta" ? (
          <>Este paso está marcado como <span className="text-tinta2">no hace falta en este proyecto</span>.</>
        ) : (
          <>Para dar este paso por listo: <span className="text-tinta2">{paso.listo_cuando}</span></>
        )}
      </p>

      <div className="mt-5 flex items-center gap-4">
        {siguiente ? (
          <Boton
            data-testid="btn-continuar"
            disabled={!superado}
            onClick={() => superado && navegar(rutaPaso(proyectoId, siguiente))}
          >
            Continuar a {siguiente.nombre}
            <ArrowRight size={18} strokeWidth={1.9} />
          </Boton>
        ) : (
          <span className="text-[14px] leading-[20px] text-tinta2">
            Es el último paso del recorrido.
          </span>
        )}
        {!superado && siguiente && (
          <span className="text-[13px] leading-[18px] text-tinta2">
            Completa este paso para continuar.
          </span>
        )}
      </div>
    </section>
  );
}
