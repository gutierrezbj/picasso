import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import { recortar } from "../../lib/mesa";

export interface DatosArista {
  texto: string;
  destino: string;
  onAbrir?: () => void;
  [clave: string]: unknown;
}

export type AristaMesa = Edge<DatosArista, "instruccion">;

export default function AristaInstruccion({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<AristaMesa>) {
  const [ruta, x, y] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const texto = data?.texto || "";
  return (
    <>
      <BaseEdge id={id} path={ruta} markerEnd={markerEnd} style={{ stroke: "#7a756d", strokeWidth: 2 }} />
      {texto && (
        <EdgeLabelRenderer>
          <button
            data-testid={`mesa-flecha-${data?.destino}`}
            title={texto}
            aria-label={`Cambio pedido: ${texto}. Abrir la versión`}
            onClick={data?.onAbrir}
            className="nodrag nopan absolute max-w-[136px] rounded-[8px] border border-linea bg-superficie2 px-2 py-1 text-left font-ui text-[11px] leading-[14px] text-tinta hover:border-acento"
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, pointerEvents: "all" }}
          >
            {recortar(texto, 54)}
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
