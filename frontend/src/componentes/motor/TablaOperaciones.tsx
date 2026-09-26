import React from "react";
import { AlertTriangle, Search, RefreshCw } from "lucide-react";
import Boton from "../Boton";
import { formatoMoneda } from "../../lib/formato";
import { ETIQUETA_ACCION, ETIQUETA_ESTADO, colorEstado, textoCoste } from "./comun";
import type { Operacion } from "../../tipos";

interface Props {
  operaciones: Operacion[];
  moneda: string;
  conProyecto?: boolean;
  onComprobar?: (op: Operacion) => void | Promise<unknown>;
  onReintentar?: (op: Operacion) => void | Promise<unknown>;
  onMarcarFallida?: (op: Operacion) => void | Promise<unknown>;
}

const fecha = (iso: string): string =>
  new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

export default function TablaOperaciones({
  operaciones,
  moneda,
  conProyecto = true,
  onComprobar,
  onReintentar,
  onMarcarFallida,
}: Props) {
  if (operaciones.length === 0) {
    return (
      <p data-testid="registro-vacio" className="text-[14px] leading-[20px] text-tinta3">
        No hay operaciones con estos filtros.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] leading-[18px]" data-testid="tabla-operaciones">
        <thead>
          <tr className="border-b border-linea text-left text-tinta2">
            <th className="py-2 pr-3 font-medium">Fecha</th>
            {conProyecto && <th className="py-2 pr-3 font-medium">Espacio · proyecto</th>}
            <th className="py-2 pr-3 font-medium">Destino</th>
            <th className="py-2 pr-3 font-medium">Acción · modelo</th>
            <th className="py-2 pr-3 font-medium">Proveedor</th>
            <th className="py-2 pr-3 font-medium">Estimado</th>
            <th className="py-2 pr-3 font-medium">Real</th>
            <th className="py-2 pr-3 font-medium">Estado</th>
            <th className="py-2 pr-3 font-medium">Intentos</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {operaciones.map((op) => (
            <tr
              key={op.id}
              data-testid={`fila-operacion-${op.id}`}
              className="border-b border-linea align-top"
            >
              <td className="py-2 pr-3 tabular text-tinta2">{fecha(op.created_at)}</td>
              {conProyecto && (
                <td className="py-2 pr-3 text-tinta2">
                  {op.espacio_nombre} · {op.proyecto_nombre}
                </td>
              )}
              <td className="py-2 pr-3 tabular text-tinta">{op.destino_etiqueta || "—"}</td>
              <td className="py-2 pr-3 text-tinta">
                {ETIQUETA_ACCION[op.accion]}
                <span className="block text-tinta2">
                  {op.modelo_visible || op.modelo}
                  {op.precio_simulado ? " · precio simulado" : ""}
                </span>
                {op.correccion_texto && (
                  <span
                    data-testid={`motivo-correccion-${op.id}`}
                    className="mt-1 block text-[12px] leading-[16px] text-tinta2"
                  >
                    Corrección: {op.correccion_texto}
                  </span>
                )}
                {op.es_exploracion && (
                  <span
                    data-testid={`motivo-exploracion-${op.id}`}
                    className="mt-1 block text-[12px] leading-[16px] text-tinta2"
                  >
                    Exploración
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 text-tinta2">{op.proveedor}</td>
              <td className="py-2 pr-3 tabular text-tinta2">
                {textoCoste(op.coste_estimado, moneda)}
              </td>
              <td className="py-2 pr-3 tabular text-tinta">
                {op.coste_real === null ? "—" : formatoMoneda(op.coste_real, moneda)}
              </td>
              <td className={`py-2 pr-3 ${colorEstado(op.estado)}`}>
                {ETIQUETA_ESTADO[op.estado]}
                {op.posicion_cola ? ` · en cola ${op.posicion_cola}` : ""}
                {op.error && (
                  <span className="mt-1 flex items-start gap-1 text-[12px] leading-[16px] text-aviso">
                    <AlertTriangle size={12} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                    {op.error}
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 tabular text-tinta2">{op.numero_intentos ?? op.intentos}</td>
              <td className="py-2">
                <div className="flex flex-wrap gap-1.5">
                  {op.estado === "incierta" && onComprobar && (
                    <Boton
                      pequeno
                      variante="secundario"
                      data-testid={`registro-comprobar-${op.id}`}
                      onClick={() => onComprobar(op)}
                    >
                      <Search size={13} strokeWidth={1.9} /> Comprobar
                    </Boton>
                  )}
                  {op.estado === "incierta" && onMarcarFallida && (
                    <Boton
                      pequeno
                      variante="texto"
                      data-testid={`registro-fallida-${op.id}`}
                      onClick={() => onMarcarFallida(op)}
                    >
                      Marcar como fallida
                    </Boton>
                  )}
                  {op.estado === "fallida" && onReintentar && (
                    <Boton
                      pequeno
                      variante="secundario"
                      data-testid={`registro-reintentar-${op.id}`}
                      onClick={() => onReintentar(op)}
                    >
                      <RefreshCw size={13} strokeWidth={1.9} /> Reintentar
                    </Boton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
