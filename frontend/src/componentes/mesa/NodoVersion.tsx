import React from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { ALTO_TARJETA, ANCHO_TARJETA } from "../../lib/mesa";

export interface DatosVersion {
  tipo: "toma" | "pendiente" | "fallida" | "incierta" | "reintento";
  etiqueta: string;
  imagen?: string;
  seleccionada?: boolean;
  favorita?: boolean;
  descartada?: boolean;
  pie: string;
  mensaje?: string;
  cargos?: string[];
  precio?: string;
  nuevo?: boolean;
  onSeleccionar?: () => void;
  onReintentar?: () => void;
  onAutorizar?: () => void;
  onComprobar?: () => void;
  onMarcarFallida?: () => void;
  onQuitar?: () => void;
  [clave: string]: unknown;
}

export type NodoVersionMesa = Node<DatosVersion, "version">;

const BOTON =
  "nodrag h-[30px] w-full rounded-control border bg-superficie2 font-ui text-[12px] font-semibold disabled:opacity-40";

export default function NodoVersion({ data }: NodeProps<NodoVersionMesa>) {
  const d = data;
  const marco = d.seleccionada ? "border-[3px] border-acento" : "border border-linea";
  return (
    <div
      data-testid={`mesa-nodo-${d.etiqueta}`}
      className={`flex flex-col rounded-card bg-superficie2 p-[5px] ${marco} ${d.descartada ? "opacity-45" : ""}`}
      style={{ width: ANCHO_TARJETA, height: ALTO_TARJETA }}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="!opacity-0" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="!opacity-0" />
      {d.tipo === "toma" && (
        <button
          onClick={d.onSeleccionar}
          aria-label={`Seleccionar ${d.etiqueta}`}
          aria-pressed={!!d.seleccionada}
          className="nodrag relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-superficie"
        >
          {d.imagen && <img src={d.imagen} alt={d.etiqueta} className="h-full w-full object-cover" />}
          {d.favorita && (
            <span className="absolute right-2 top-2 rounded-[8px] bg-superficie2 px-1.5 py-0.5 text-[12px] font-extrabold text-acento">★</span>
          )}
        </button>
      )}
      {d.tipo === "pendiente" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[14px] bg-superficie text-[13px] font-bold text-acento">
          <Loader2 size={18} className="animate-spin" /> Generando…
          <span className="text-[12px] font-normal">{d.precio} reservado</span>
        </div>
      )}
      {d.tipo === "fallida" && (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto rounded-[14px] border-[1.5px] border-error bg-superficie p-2.5 text-[12px] leading-[16px] text-error">
          <b>Falló</b>
          <span className="text-tinta2">{d.mensaje || "El proveedor devolvió un error."}</span>
          {(d.cargos || []).map((c) => (
            <span key={c} className="text-aviso">{c}</span>
          ))}
          <button className={`${BOTON} mt-auto border-error text-error`} onClick={d.onReintentar}>Reintentar…</button>
          <button className="nodrag text-[11px] text-tinta2 underline" onClick={d.onQuitar}>Quitar de la Mesa</button>
        </div>
      )}
      {d.tipo === "incierta" && (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 rounded-[14px] border-[1.5px] border-acento bg-superficie p-2.5 text-[12px] leading-[16px] text-acento">
          <b>Sin confirmar</b>
          <span className="text-tinta2">Se envió y no hubo respuesta. No se reenvía sola.</span>
          <button className={`${BOTON} mt-auto border-acento text-acento`} onClick={d.onComprobar}>Comprobar</button>
          <button className="nodrag text-[11px] text-tinta2 underline" onClick={d.onMarcarFallida}>Marcar como fallida</button>
        </div>
      )}
      {d.tipo === "reintento" && (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-tinta3 bg-superficie p-2.5 text-[12px] leading-[16px] text-tinta2">
          <b className="text-tinta">{d.nuevo ? "Sin autorizar" : "Reintento sin autorizar"}</b>
          <span>No se envía hasta que lo autorices.</span>
          {(d.cargos || []).map((c) => (
            <span key={c} className="text-aviso">{c}</span>
          ))}
          <button className={`${BOTON} mt-auto border-acento bg-acento text-sobreAcento`} onClick={d.onAutorizar}>
            Autorizar · {d.precio}
          </button>
          <button className="nodrag text-[11px] text-tinta2 underline" onClick={d.onQuitar}>Descartar</button>
        </div>
      )}
      <div className="flex items-center justify-between px-1 pt-1.5 text-[12px]">
        <b className="text-tinta">{d.etiqueta}</b>
        <span className="truncate pl-2 text-tinta2">{d.pie}</span>
      </div>
    </div>
  );
}
