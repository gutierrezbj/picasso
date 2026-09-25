import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Boton from "../Boton";
import type { EscenaConPlanos } from "../../tipos";

interface Props {
  escenas: EscenaConPlanos[];
  indice: number;
  onIndice: (i: number) => void;
  onCerrar: () => void;
  onAbrirPlano: (planoId: string) => void;
}

// Guion gráfico de una escena (§7.7c): la tira de sus planos en orden, con
// miniatura o hueco y su resumen de dirección.
export default function GuionGrafico({ escenas, indice, onIndice, onCerrar, onAbrirPlano }: Props) {
  const actual = escenas[indice];
  if (!actual) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-fondo px-6 py-8"
      data-testid="guion-grafico"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] leading-[18px] text-tinta2">
              Guion gráfico · escena {indice + 1} de {escenas.length}
            </p>
            <h1 className="text-[26px] leading-[34px] font-semibold text-tinta">
              {actual.escena.titulo || "Escena sin título"}
            </h1>
            <p className="mt-1 max-w-[80ch] text-[14px] leading-[20px] text-tinta2">
              {actual.escena.que_ocurre}
            </p>
          </div>
          <button
            data-testid="cerrar-guion-grafico"
            onClick={onCerrar}
            aria-label="Cerrar guion gráfico"
            className="flex h-11 w-11 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>

        {actual.planos.length === 0 ? (
          <p className="mt-10 text-[16px] leading-[24px] text-tinta2" data-testid="tira-vacia">
            Esta escena todavía no tiene planos.
          </p>
        ) : (
          <ol className="mt-8 flex gap-4 overflow-x-auto pb-4" data-testid="tira-planos">
            {actual.planos.map((p, i) => (
              <li key={p.id} className="w-[240px] shrink-0">
                <button
                  data-testid={`tira-plano-${i + 1}`}
                  onClick={() => onAbrirPlano(p.id)}
                  className="w-full rounded-card border border-linea bg-superficie p-3 text-left hover:border-acento focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  <div className="flex items-center justify-between">
                    <span className="tabular text-[12px] leading-[16px] font-semibold text-tinta">
                      E{indice + 1}·P{i + 1}
                    </span>
                    <span className="text-[12px] leading-[16px] text-tinta2">
                      {p.modalidad === "video" ? "Vídeo" : "Imagen"}
                    </span>
                  </div>
                  <div className="mt-2 flex h-[130px] items-center justify-center rounded-control bg-superficie2">
                    <span className="text-[13px] text-tinta3">sin toma</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-[18px] text-tinta">
                    {p.que_se_muestra || "sin describir"}
                  </p>
                  <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
                    {p.resumen_direccion || "sin dirigir"}
                  </p>
                  {p.correcciones_pendientes > 0 && (
                    <p className="mt-1 text-[12px] leading-[16px] text-aviso">
                      {p.correcciones_pendientes} pendiente
                      {p.correcciones_pendientes === 1 ? "" : "s"}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Boton
            variante="secundario"
            data-testid="escena-anterior"
            disabled={indice === 0}
            onClick={() => onIndice(indice - 1)}
          >
            <ChevronLeft size={16} strokeWidth={1.9} /> Escena anterior
          </Boton>
          <Boton
            variante="secundario"
            data-testid="escena-siguiente"
            disabled={indice >= escenas.length - 1}
            onClick={() => onIndice(indice + 1)}
          >
            Escena siguiente <ChevronRight size={16} strokeWidth={1.9} />
          </Boton>
        </div>
      </div>
    </div>
  );
}
