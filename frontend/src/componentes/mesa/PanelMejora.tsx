import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { formatoMonedaFino } from "../../lib/formato";
import { lineasIntentoMejora } from "../motor/comun";

const EN_MARCHA = ["autorizada", "enviada", "en_curso"];

function resaltar(antes: string, despues: string): React.ReactNode[] {
  const vistas = new Set(antes.toLowerCase().split(/\s+/).filter(Boolean));
  return despues.split(/(\s+)/).map((p, i) =>
    p.trim() && !vistas.has(p.toLowerCase()) ? (
      <span key={i} className="bg-acentoSuave">
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

interface Props {
  mejoras: any[];
  borrador: any;
  bloqueo: any | null;
  ocupado: boolean;
  reintentos: Record<string, any>;
  onCerrar: () => void;
  onAceptar: (m: any, usarCopia: boolean) => void;
  onDescartar: (m: any) => void;
  onGuardarCopia: (m: any, texto: string) => Promise<void>;
  onBorrarCopia: () => Promise<void>;
  onPedirReintento: (m: any) => void;
  onConfirmarReintento: (m: any) => void;
  onComprobar: (m: any) => void;
  onMarcarFallida: (m: any) => void;
  onEntendido: (opId: string) => void;
  onResolverCargo: (intentoId: string, cobrado: boolean) => void;
}

function Tarjeta({ m, p }: { m: any; p: Props }) {
  const copia = p.borrador?.copia_propuesta?.operacion_id === m.id ? p.borrador.copia_propuesta.texto : null;
  const [editando, setEditando] = useState<string | null>(copia);
  const r = m.resultado || null;
  const enMarcha = EN_MARCHA.includes(m.estado);
  const completa = m.estado === "completada" && r?.calidad === "completa";
  const sinConsumo = r && r.estado_consumo && r.estado_consumo !== "valido";
  const reintento = p.reintentos[m.id];
  const pendientes = (m.coste?.cargos || []).filter((c: any) => c.estado === "pendiente");
  const base = r?.texto || r?.parcial || "";
  return (
    <div data-testid={`mejora-${m.id}`} className="flex flex-col gap-2 rounded-[12px] border border-linea bg-superficie2 p-3 text-[13px] leading-[18px]">
      <div className="flex items-center gap-2">
        <b>Mejora · revisión {m.revision}</b>
        <span className="text-tinta2">{enMarcha ? "en curso" : m.estado}</span>
        {m.proveedor === "simulado" && <span className="rounded-[6px] bg-superficie px-1.5 text-[11px] text-tinta2">simulado</span>}
      </div>
      {m.para_texto_anterior && (
        <span data-testid="mejora-texto-anterior" className="text-aviso">
          Propuesta para un texto anterior (revisión {m.revision}). No se aplica a la barra.
        </span>
      )}
      <div className="text-tinta2">
        <b className="text-tinta">Lo que escribiste:</b> {m.texto_original}
      </div>
      {enMarcha && (
        <span className="flex items-center gap-2 text-tinta2">
          <Loader2 size={14} className="animate-spin" /> Pidiendo la propuesta en segundo plano…
        </span>
      )}
      {completa && (
        <div data-testid="mejora-propuesta" className="rounded-[8px] bg-superficie p-2">
          <b>Propuesta:</b> {resaltar(m.texto_original || "", r.texto)}
        </div>
      )}
      {r && !completa && (r.aviso || r.parcial) && (
        <div data-testid="mejora-incompleta" className="rounded-[8px] bg-superficie p-2">
          {r.aviso && <b className="block text-aviso">{r.aviso}</b>}
          {r.parcial && <span className="text-tinta2">{r.parcial}</span>}
          {!r.parcial && <span className="text-tinta2">No hubo propuesta.</span>}
        </div>
      )}
      {completa && (r.cambios || []).length > 0 && (
        <ul className="list-disc pl-4 text-tinta2">
          {r.cambios.map((c: any, i: number) => (
            <li key={i}>
              <b className="text-tinta">{c.parte}.</b> {c.motivo}
            </li>
          ))}
        </ul>
      )}
      {m.error && !r?.aviso && !enMarcha && <span className="text-aviso">{m.error}</span>}
      <div data-testid="mejora-coste" className="flex flex-col gap-0.5 text-[12px] text-tinta2">
        {lineasIntentoMejora(m.coste, "USD").map((l, i) => (
          <span key={i} data-testid={`mejora-intento-${i + 1}`}>
            {l}
          </span>
        ))}
        {m.coste?.estimado_adicional > 0 && (
          <span data-testid="mejora-acumulado">
            Hasta ahora: {formatoMonedaFino(m.coste.estimado_adicional, "USD")} estimado + {formatoMonedaFino(m.coste.contado, "USD")} reservado
          </span>
        )}
        {sinConsumo && completa && (
          <span data-testid="mejora-sin-consumo" className="text-aviso">
            Coste sin informar por OpenAI: posible cargo pendiente de {formatoMonedaFino(m.reserva_estimada, "USD")} (reserva estimada).
          </span>
        )}
        {pendientes.map((c: any) => (
          <span key={c.intento_id} className="flex flex-wrap items-center gap-2 text-aviso">
            Intento {c.numero}: posible cargo sin confirmar · {formatoMonedaFino(c.estimado, "USD")}
            <button data-testid={`mejora-sin-cargo-${c.numero}`} className="text-acento underline" onClick={() => p.onResolverCargo(c.intento_id, false)}>
              No hubo cargo
            </button>
          </span>
        ))}
      </div>
      {editando !== null && (
        <div className="flex flex-col gap-1.5">
          <textarea
            data-testid="mejora-copia"
            aria-label="Copia de la propuesta"
            value={editando}
            onChange={(e) => setEditando(e.target.value)}
            onBlur={() => p.onGuardarCopia(m, editando)}
            className="h-[96px] resize-none rounded-[8px] border-[1.5px] border-linea bg-superficie px-2 py-1.5 text-[13px] text-tinta outline-none focus:border-acento"
          />
          <span className="text-[12px] text-tinta2">Editas una copia: la barra no cambia hasta que aceptes.</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {m.bloqueo?.activo && (
          <button data-testid="mejora-entendido" className="h-8 rounded-[8px] bg-acento px-3 font-bold text-sobreAcento" onClick={() => p.onEntendido(m.id)}>
            Entendido, seguir
          </button>
        )}
        {completa && editando === null && (
          <button data-testid="mejora-aceptar" disabled={p.ocupado} className="h-8 rounded-[8px] bg-acento px-3 font-bold text-sobreAcento disabled:opacity-45" onClick={() => p.onAceptar(m, false)}>
            Aceptar
          </button>
        )}
        {editando !== null ? (
          <>
            <button
              data-testid="mejora-aceptar-copia"
              disabled={p.ocupado || !editando.trim()}
              className="h-8 rounded-[8px] bg-acento px-3 font-bold text-sobreAcento disabled:opacity-45"
              onClick={async () => {
                await p.onGuardarCopia(m, editando);
                p.onAceptar(m, true);
              }}
            >
              Aceptar la copia
            </button>
            <button
              data-testid="mejora-cancelar-copia"
              className="h-8 rounded-[8px] border border-linea px-3"
              onClick={async () => {
                setEditando(null);
                await p.onBorrarCopia();
              }}
            >
              Cancelar edición
            </button>
          </>
        ) : (
          base &&
          !enMarcha && (
            <button
              data-testid="mejora-editar"
              className="h-8 rounded-[8px] border border-linea px-3"
              onClick={async () => {
                setEditando(base);
                await p.onGuardarCopia(m, base);
              }}
            >
              Editar antes de aceptar
            </button>
          )
        )}
        {m.estado === "fallida" && !m.bloqueo?.activo &&
          (reintento ? (
            <button data-testid="mejora-confirmar-reintento" disabled={p.ocupado} className="h-8 rounded-[8px] bg-acento px-3 font-bold text-sobreAcento disabled:opacity-45" onClick={() => p.onConfirmarReintento(m)}>
              Volver a pedir · reserva estimada {formatoMonedaFino(reintento.reserva_estimada, "USD")}
            </button>
          ) : (
            <button data-testid="mejora-reintentar" disabled={p.ocupado} className="h-8 rounded-[8px] border border-acento px-3 text-acento disabled:opacity-45" onClick={() => p.onPedirReintento(m)}>
              Volver a pedir…
            </button>
          ))}
        {m.estado === "incierta" && (
          <>
            <button data-testid="mejora-comprobar" className="h-8 rounded-[8px] border border-acento px-3 text-acento" onClick={() => p.onComprobar(m)}>
              Comprobar
            </button>
            <button data-testid="mejora-marcar-fallida" className="h-8 rounded-[8px] border border-linea px-3" onClick={() => p.onMarcarFallida(m)}>
              Marcar como fallida
            </button>
          </>
        )}
        {!enMarcha && m.estado !== "incierta" && (
          <button data-testid="mejora-descartar" className="h-8 rounded-[8px] px-3 text-tinta2 underline" onClick={() => p.onDescartar(m)}>
            Descartar
          </button>
        )}
      </div>
    </div>
  );
}

export default function PanelMejora(p: Props) {
  const visibles = p.mejoras.filter((m) => !m.decision);
  return (
    <div
      data-testid="panel-mejora"
      className="absolute bottom-3 right-4 z-20 flex max-h-[calc(100%-24px)] w-[440px] max-w-[calc(100%-32px)] flex-col gap-2.5 overflow-auto rounded-[16px] border border-linea bg-superficie p-3.5 shadow-context"
    >
      <div className="flex items-center">
        <b className="text-[14px]">Mejorar mi descripción</b>
        <button aria-label="Cerrar mejoras" data-testid="panel-mejora-cerrar" onClick={p.onCerrar} className="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] bg-superficie2">
          <X size={14} />
        </button>
      </div>
      {p.bloqueo && !visibles.some((m) => m.id === p.bloqueo.operacion_id) && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-aviso" data-testid="mejora-bloqueo">
          Mejorar está bloqueado: una mejora {p.bloqueo.motivo}.
          <button data-testid="mejora-entendido" className="text-acento underline" onClick={() => p.onEntendido(p.bloqueo.operacion_id)}>
            Entendido, seguir
          </button>
        </div>
      )}
      {visibles.length === 0 && <span className="text-[13px] text-tinta2">No hay propuestas pendientes en este borrador.</span>}
      {visibles.map((m) => (
        <Tarjeta key={m.id + (p.borrador?.copia_propuesta?.operacion_id === m.id ? ":c" : "")} m={m} p={p} />
      ))}
    </div>
  );
}
