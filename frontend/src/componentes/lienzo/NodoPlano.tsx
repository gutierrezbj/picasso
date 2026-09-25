import React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Scissors,
  Trash2,
  SlidersHorizontal,
  Link2,
} from "lucide-react";
import type { DatosPlano } from "../../lib/lienzo";
import { ANCHO_PLANO } from "../../lib/lienzo";
import { useAccionesLienzo } from "./contexto";

// Tarjeta de plano (§7.2 y §7.7c): resumen de dirección, correcciones pendientes
// y todas las acciones con botón visible.
export default function NodoPlano({ id, data, selected }: NodeProps<Node<DatosPlano>>) {
  const { plano, etiqueta } = data;
  const acciones = useAccionesLienzo();

  const boton =
    "flex h-8 w-8 items-center justify-center rounded-control border border-linea bg-superficie text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento";

  return (
    <div
      data-testid={`nodo-plano-${etiqueta}`}
      style={{ width: ANCHO_PLANO }}
      className={
        "rounded-card border bg-superficie p-3 shadow-sm " +
        (selected ? "border-acento ring-2 ring-acento" : "border-linea")
      }
    >
      <Handle type="target" position={Position.Left} className="!bg-linea" />
      <div className="flex items-center justify-between gap-2">
        <span className="tabular text-[12px] leading-[16px] font-semibold text-tinta">{etiqueta}</span>
        <span className="text-[12px] leading-[16px] text-tinta2">
          {plano.modalidad === "video" ? "Vídeo" : "Imagen"}
        </span>
      </div>

      <div className="mt-2 flex h-[92px] items-center justify-center rounded-control bg-superficie2">
        <span className="text-[13px] text-tinta3">sin toma</span>
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] leading-[18px] text-tinta">
        {plano.que_se_muestra || <span className="text-tinta3">sin describir</span>}
      </p>
      <p
        className="mt-1 line-clamp-2 text-[12px] leading-[16px] text-tinta2"
        data-testid={`resumen-direccion-${etiqueta}`}
      >
        {plano.resumen_direccion || "sin dirigir"}
      </p>

      {plano.plano_anterior_encadenado && (
        <p
          data-testid={`encadenado-${etiqueta}`}
          className={
            "mt-1 inline-flex items-center gap-1 text-[12px] leading-[16px] " +
            (plano.encadenado_sin_anterior ? "text-aviso" : "text-tinta2")
          }
        >
          <Link2 size={12} strokeWidth={1.9} />{" "}
          {plano.encadenado_sin_anterior
            ? "encadenado sin plano anterior"
            : "encadenado con el anterior"}
        </p>
      )}

      {plano.correcciones_pendientes > 0 && (
        <p
          data-testid={`correcciones-pendientes-${etiqueta}`}
          className="mt-2 rounded-control bg-superficie2 px-2 py-1 text-[12px] leading-[16px] text-aviso"
        >
          {plano.correcciones_pendientes}{" "}
          {plano.correcciones_pendientes === 1 ? "corrección pendiente" : "correcciones pendientes"}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          data-testid={`dirigir-${etiqueta}`}
          onClick={() => acciones.abrirFicha(id)}
          className="inline-flex items-center gap-1 rounded-control bg-acento px-2 py-1 text-[13px] leading-[18px] text-white hover:bg-acentoTinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <SlidersHorizontal size={14} strokeWidth={1.9} /> Dirigir
        </button>
        <button
          data-testid={`mover-antes-${etiqueta}`}
          aria-label="Mover antes"
          title="Mover antes"
          onClick={() => acciones.moverPlano(plano.id, "antes")}
          className={boton}
        >
          <ChevronLeft size={15} strokeWidth={1.9} />
        </button>
        <button
          data-testid={`mover-despues-${etiqueta}`}
          aria-label="Mover después"
          title="Mover después"
          onClick={() => acciones.moverPlano(plano.id, "despues")}
          className={boton}
        >
          <ChevronRight size={15} strokeWidth={1.9} />
        </button>
        <button
          data-testid={`duplicar-${etiqueta}`}
          aria-label="Duplicar plano"
          title="Duplicar"
          onClick={() => acciones.duplicarPlano(plano.id)}
          className={boton}
        >
          <Copy size={14} strokeWidth={1.9} />
        </button>
        <button
          data-testid={`dividir-${etiqueta}`}
          aria-label="Dividir plano"
          title="Dividir"
          onClick={() => acciones.dividirPlano(plano.id)}
          className={boton}
        >
          <Scissors size={14} strokeWidth={1.9} />
        </button>
        <button
          data-testid={`borrar-plano-${etiqueta}`}
          aria-label="Borrar plano"
          title="Borrar"
          onClick={() => acciones.borrarPlano(plano.id)}
          className={boton}
        >
          <Trash2 size={14} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}
