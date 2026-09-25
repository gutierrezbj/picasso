import React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { BookOpen } from "lucide-react";
import type { DatosElemento } from "../../lib/lienzo";
import { ANCHO_ELEMENTO } from "../../lib/lienzo";
import { useAccionesLienzo } from "./contexto";

const CLASES: Record<string, string> = {
  personaje: "Personaje",
  escenario: "Escenario",
  objeto: "Objeto",
  producto: "Producto",
};

// Tarjeta de elemento del reparto (§7.2). La referencia no se recorta.
export default function NodoElemento({ id, data, selected }: NodeProps<Node<DatosElemento>>) {
  const { entrada } = data;
  const acciones = useAccionesLienzo();
  const ref = entrada.referencia_principal;

  return (
    <div
      data-testid={`nodo-elemento-${entrada.elemento.nombre}`}
      style={{ width: ANCHO_ELEMENTO }}
      className={
        "rounded-card border bg-superficie p-3 shadow-sm transition-colors duration-[120ms] ease-suave " +
        (selected ? "border-acento ring-2 ring-acento" : "border-linea")
      }
    >
      <div className="flex h-[110px] items-center justify-center overflow-hidden rounded-control bg-superficie2">
        {ref ? (
          <img
            src={acciones.urlMedio(ref)}
            alt={entrada.elemento.nombre}
            className="max-h-[110px] max-w-full object-contain"
          />
        ) : (
          <span className="text-[13px] text-tinta3">sin referencia</span>
        )}
      </div>
      <div className="mt-2 text-[14px] leading-[20px] font-semibold text-tinta">
        {entrada.elemento.nombre}
      </div>
      <div className="text-[12px] leading-[16px] text-tinta2">
        {CLASES[entrada.elemento.clase] || entrada.elemento.clase} · v{entrada.version_ficha}
      </div>
      <button
        data-testid={`abrir-ficha-${entrada.elemento.nombre}`}
        onClick={() => acciones.abrirFicha(id)}
        className="mt-2 inline-flex items-center gap-1 rounded-control px-2 py-1 text-[13px] leading-[18px] text-acento hover:bg-acentoSuave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
      >
        <BookOpen size={14} strokeWidth={1.9} /> Abrir ficha
      </button>
      <Handle type="source" position={Position.Right} className="!bg-linea" />
    </div>
  );
}
