import React from "react";
import { type NodeProps, type Node } from "@xyflow/react";
import { ChevronDown, ChevronRight, Plus, Film, FileText } from "lucide-react";
import type { DatosEscena } from "../../lib/lienzo";
import { ANCHO_ESCENA } from "../../lib/lienzo";
import { useAccionesLienzo } from "./contexto";

// Tarjeta de escena (§7.2): grupo plegable con sus planos.
export default function NodoEscena({ data, selected }: NodeProps<Node<DatosEscena>>) {
  const acciones = useAccionesLienzo();
  const plegada = acciones.plegados.includes(data.escenaId);

  return (
    <div
      data-testid={`nodo-escena-${data.orden}`}
      style={{ width: ANCHO_ESCENA }}
      className={
        "rounded-card border bg-superficie2 p-4 shadow-sm " +
        (selected ? "border-acento ring-2 ring-acento" : "border-linea")
      }
    >
      <div className="text-[12px] leading-[16px] text-tinta2">Escena {data.orden}</div>
      <div className="mt-1 text-[15px] leading-[22px] font-semibold text-tinta">{data.titulo}</div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-tinta2">{data.resumen}</p>
      <div className="mt-2 text-[12px] leading-[16px] text-tinta2" data-testid={`escena-num-planos-${data.orden}`}>
        {data.numPlanos} {data.numPlanos === 1 ? "plano" : "planos"}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          data-testid={`plegar-escena-${data.orden}`}
          onClick={() => acciones.alternarPlegado(data.escenaId)}
          className="inline-flex items-center gap-1 rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          {plegada ? <ChevronRight size={14} strokeWidth={1.9} /> : <ChevronDown size={14} strokeWidth={1.9} />}
          {plegada ? "Desplegar" : "Plegar"}
        </button>
        <button
          data-testid={`anadir-plano-${data.orden}`}
          onClick={() => acciones.anadirPlano(data.escenaId)}
          className="inline-flex items-center gap-1 rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Plus size={14} strokeWidth={1.9} /> Añadir plano
        </button>
        <button
          data-testid={`guion-grafico-${data.orden}`}
          onClick={() => acciones.abrirGuionGrafico(data.escenaId)}
          className="inline-flex items-center gap-1 rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Film size={14} strokeWidth={1.9} /> Guion gráfico
        </button>
        <button
          data-testid={`ver-en-guion-${data.orden}`}
          onClick={acciones.verEnGuion}
          className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-[13px] leading-[18px] text-acento hover:bg-acentoSuave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <FileText size={14} strokeWidth={1.9} /> Ver en guion
        </button>
      </div>
    </div>
  );
}
