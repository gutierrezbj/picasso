import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Download } from "lucide-react";
import Boton from "../Boton";
import TablaOperaciones from "./TablaOperaciones";
import { api } from "../../api/cliente";
import { formatoMoneda } from "../../lib/formato";

interface Props {
  proyectoId: string;
  onCerrar: () => void;
}

/** Panel «Registro» dentro del lienzo (§9.5): el mismo dato del registro global,
 * filtrado a este proyecto. */
export default function PanelRegistro({ proyectoId, onCerrar }: Props) {
  const filtros = { proyecto_id: proyectoId };
  const { data: operaciones, refetch } = useQuery({
    queryKey: ["registro", proyectoId],
    queryFn: () => api.operaciones(filtros),
    refetchInterval: 5000,
  });
  const { data: totales } = useQuery({
    queryKey: ["registro-totales", proyectoId],
    queryFn: () => api.totalesRegistro(filtros),
    refetchInterval: 5000,
  });
  const moneda = totales?.moneda || "USD";

  return (
    <div
      data-testid="panel-registro"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[62vh] overflow-auto border-t border-linea bg-superficie p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] leading-[26px] font-semibold text-tinta">
            Registro del proyecto
          </h2>
          {totales && (
            <p className="mt-1 text-[13px] leading-[18px] text-tinta2">
              {totales.operaciones} operaciones · {formatoMoneda(totales.total, moneda)}
              {totales.sin_verificar > 0 && ` · ${totales.sin_verificar} con coste sin verificar`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.urlRegistroCsv(filtros)}
            data-testid="registro-csv-proyecto"
            className="inline-flex items-center gap-1 rounded-control px-3 py-1.5 text-[14px] leading-[20px] text-acento hover:bg-acentoSuave"
          >
            <Download size={15} strokeWidth={1.9} /> CSV
          </a>
          <button
            data-testid="cerrar-panel-registro"
            aria-label="Cerrar el registro"
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            <X size={18} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <TablaOperaciones
          operaciones={operaciones || []}
          moneda={moneda}
          conProyecto={false}
          onComprobar={async (op) => {
            await api.comprobarOperacion(op.id);
            await refetch();
          }}
          onReintentar={async (op) => {
            await api.reintentarOperacion(op.id);
            await refetch();
          }}
          onMarcarFallida={async (op) => {
            await api.marcarFallida(op.id);
            await refetch();
          }}
        />
      </div>
    </div>
  );
}
