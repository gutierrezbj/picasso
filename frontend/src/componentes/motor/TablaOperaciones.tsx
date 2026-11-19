import React, { useState } from "react";
import { AlertTriangle, Search, RefreshCw } from "lucide-react";
import Boton from "../Boton";
import Dialogo from "../Dialogo";
import { Campo, Entrada } from "../Campo";
import { ETIQUETA_ACCION, ETIQUETA_ESTADO, colorEstado, lineasIntentoMejora, textoCoste, textoImporte } from "./comun";
import { formatoMonedaFino } from "../../lib/formato";
import type { Operacion } from "../../tipos";

interface Props {
  operaciones: Operacion[];
  moneda: string;
  conProyecto?: boolean;
  onComprobar?: (op: Operacion) => void | Promise<unknown>;
  onReintentar?: (op: Operacion) => void | Promise<unknown>;
  onMarcarFallida?: (op: Operacion) => void | Promise<unknown>;
  onResolverCargo?: (intentoId: string, cobrado: boolean, importe?: number) => void | Promise<unknown>;
}

const fecha = (iso: string): string =>
  new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

type CargoAbierto = { intentoId: string; numero: number; estimado: number | null };

function DialogoCargo({
  cargo,
  moneda,
  onCerrar,
  onApuntar,
}: {
  cargo: CargoAbierto | null;
  moneda: string;
  onCerrar: () => void;
  onApuntar: (intentoId: string, importe: number) => void | Promise<unknown>;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [abiertoPara, setAbiertoPara] = useState<string | null>(null);
  if (cargo && abiertoPara !== cargo.intentoId) {
    setAbiertoPara(cargo.intentoId);
    setTexto(cargo.estimado === null ? "" : String(cargo.estimado).replace(".", ","));
    setError(null);
    setGuardando(false);
  }
  const limpio = texto.trim().replace(",", ".");
  const importe = /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
  const cerrar = () => {
    if (guardando) return;
    setAbiertoPara(null);
    onCerrar();
  };
  const apuntar = async () => {
    if (!cargo || importe === null || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await onApuntar(cargo.intentoId, importe);
      setGuardando(false);
      setAbiertoPara(null);
      onCerrar();
    } catch (e) {
      setGuardando(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Dialogo
      abierto={cargo !== null}
      onCerrar={cerrar}
      titulo={cargo ? `Hubo cargo en el intento ${cargo.numero}` : ""}
      ancho="max-w-[480px]"
      data-testid="dialogo-cargo"
    >
      <Campo
        etiqueta={`Importe cobrado, según el proveedor (${moneda})`}
        htmlFor="importe-cargo"
        ayuda={cargo && cargo.estimado !== null ? `Estimación de este intento: ${textoCoste(cargo.estimado, moneda)}.` : undefined}
      >
        <Entrada
          id="importe-cargo"
          data-testid="importe-cargo"
          inputMode="decimal"
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apuntar()}
        />
      </Campo>
      {texto.trim() !== "" && importe === null && (
        <p className="mt-3 text-[13px] leading-[18px] text-aviso">Escribe un importe en número, sin signo (por ejemplo 0,15).</p>
      )}
      {error && (
        <p data-testid="error-cargo" className="mt-3 text-[13px] leading-[18px] text-aviso">
          {error}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Boton data-testid="btn-apuntar-cargo" disabled={importe === null || guardando} onClick={apuntar}>
          {guardando ? "Apuntando…" : "Apuntar cargo"}
        </Boton>
        <Boton data-testid="btn-cancelar-cargo" variante="secundario" disabled={guardando} onClick={cerrar}>
          Cancelar
        </Boton>
      </div>
    </Dialogo>
  );
}

export default function TablaOperaciones({
  operaciones,
  moneda,
  conProyecto = true,
  onComprobar,
  onReintentar,
  onMarcarFallida,
  onResolverCargo,
}: Props) {
  const [cargoAbierto, setCargoAbierto] = useState<CargoAbierto | null>(null);
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
            <th className="py-2 pr-3 font-medium">Importe</th>
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
                {op.accion === "mejorar_texto" ? `${formatoMonedaFino(op.coste_estimado, moneda)} reserva estimada` : textoCoste(op.coste_estimado, moneda)}
              </td>
              <td className="py-2 pr-3 tabular text-tinta">
                {textoImporte(op.coste, moneda)}
                {lineasIntentoMejora(op.coste, moneda).map((linea, i) => (
                  <span key={i} data-testid={`intento-mejora-${op.id}-${i + 1}`} className="mt-1 block text-[12px] leading-[16px] text-tinta2">
                    {linea}
                  </span>
                ))}
                {(op.coste?.cargos || []).map((cargo) => (
                  <span
                    key={cargo.intento_id}
                    data-testid={`cargo-${cargo.intento_id}`}
                    className={"mt-1 block text-[12px] leading-[16px] " + (cargo.estado === "pendiente" ? "text-aviso" : "text-tinta2")}
                  >
                    Intento {cargo.numero}:{" "}
                    {cargo.estado === "pendiente"
                      ? `posible cargo sin confirmar · ${op.accion === "mejorar_texto" ? formatoMonedaFino(cargo.estimado, moneda) : textoCoste(cargo.estimado, moneda)}`
                      : cargo.estado === "sin_cargo"
                        ? "sin cargo"
                        : `cobrado ${textoCoste(cargo.importe, moneda)}, apuntado a mano`}
                    {cargo.estado === "pendiente" && onResolverCargo && (
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        <Boton
                          pequeno
                          variante="secundario"
                          data-testid={`sin-cargo-${cargo.intento_id}`}
                          onClick={() => onResolverCargo(cargo.intento_id, false)}
                        >
                          No hubo cargo
                        </Boton>
                        <Boton
                          pequeno
                          variante="texto"
                          data-testid={`con-cargo-${cargo.intento_id}`}
                          onClick={() =>
                            setCargoAbierto({ intentoId: cargo.intento_id, numero: cargo.numero, estimado: cargo.estimado })
                          }
                        >
                          Hubo cargo…
                        </Boton>
                      </span>
                    )}
                  </span>
                ))}
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
                  {op.estado === "fallida" && onReintentar && op.accion !== "mejorar_texto" && (
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
      {onResolverCargo && (
        <DialogoCargo
          cargo={cargoAbierto}
          moneda={moneda}
          onCerrar={() => setCargoAbierto(null)}
          onApuntar={(intentoId, importe) => onResolverCargo(intentoId, true, importe)}
        />
      )}
    </div>
  );
}
