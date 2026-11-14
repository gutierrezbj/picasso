import React, { useEffect, useMemo } from "react";
import { Background, Controls, MarkerType, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NodoVersion, { type NodoVersionMesa } from "./NodoVersion";
import AristaInstruccion, { type AristaMesa } from "./AristaInstruccion";

const tiposNodo = { version: NodoVersion };
const tiposArista = { instruccion: AristaInstruccion };

interface Props {
  nodos: NodoVersionMesa[];
  aristas: AristaMesa[];
  vacia: React.ReactNode;
  ajuste?: string;
}

function Ajustar({ clave }: { clave: string }): null {
  const flujo = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => flujo.fitView({ padding: 0.2, maxZoom: 1, duration: 200 }), 30);
    return () => clearTimeout(t);
  }, [clave, flujo]);
  return null;
}

export default function Mesa({ nodos, aristas, vacia, ajuste = "" }: Props) {
  const clave = nodos.map((n) => n.id).join("|") + "#" + ajuste;
  const conFlecha = useMemo(
    () => aristas.map((a) => ({ ...a, markerEnd: { type: MarkerType.ArrowClosed, color: "#7a756d", width: 16, height: 16 } })),
    [aristas]
  );
  return (
    <div className="relative h-full w-full bg-mesa" data-testid="mesa">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodos}
          edges={conFlecha}
          nodeTypes={tiposNodo}
          edgeTypes={tiposArista}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, nodo) => nodo.data.onSeleccionar?.()}
          minZoom={0.25}
          maxZoom={1.6}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          style={{ background: "transparent" }}
        >
          <Background gap={20} color="#2B2B2B" />
          <Controls showInteractive={false} />
          <Ajustar clave={clave} />
        </ReactFlow>
      </ReactFlowProvider>
      {!nodos.length && <div className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center">{vacia}</div>}
    </div>
  );
}
