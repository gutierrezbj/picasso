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
  Play,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../api/cliente";
import type { DatosPlano } from "../../lib/lienzo";
import { ANCHO_PLANO } from "../../lib/lienzo";
import { useAccionesLienzo } from "./contexto";

const ESTADOS: Record<string, string> = {
  sin_dirigir: "sin dirigir",
  dirigido: "dirigido",
  en_produccion: "en producción",
  con_tomas: "con tomas",
  resuelto: "resuelto",
};

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

      {plano.toma_elegida?.medio ? (
        <div className="mt-2 overflow-hidden rounded-control bg-superficie2">
          {plano.toma_elegida.medio.clase === "video" ? (
            <video
              src={api.urlMedio(plano.toma_elegida.medio.id)}
              muted
              className="h-[92px] w-full object-contain"
              data-testid={`toma-elegida-${etiqueta}`}
            />
          ) : (
            <img
              src={api.urlMedio(plano.toma_elegida.medio.id)}
              alt={`Toma elegida del plano ${etiqueta}`}
              className="h-[92px] w-full object-contain"
              data-testid={`toma-elegida-${etiqueta}`}
            />
          )}
        </div>
      ) : (
        <div className="mt-2 flex h-[92px] items-center justify-center rounded-control bg-superficie2">
          <span className="text-[13px] text-tinta3">
            {plano.estado_produccion === "en_produccion" ? "produciendo…" : "sin toma"}
          </span>
        </div>
      )}

      <p className="mt-1 text-[12px] leading-[16px] text-tinta2" data-testid={`estado-plano-${etiqueta}`}>
        {ESTADOS[plano.estado_produccion]}
        {plano.numero_tomas > 0 && ` · ${plano.numero_tomas} toma${plano.numero_tomas === 1 ? "" : "s"}`}
      </p>

      {plano.desactualizado && (
        <p
          data-testid={`desactualizado-${etiqueta}`}
          className="mt-1 inline-flex items-center gap-1 text-[12px] leading-[16px] text-aviso"
        >
          <AlertTriangle size={12} strokeWidth={1.9} /> desactualizado
        </p>
      )}

      {plano.operacion_incierta && (
        <p
          data-testid={`incierta-${etiqueta}`}
          className="mt-1 text-[12px] leading-[16px] text-aviso"
        >
          operación incierta: compruébala en Producir
        </p>
      )}

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
          data-testid={`producir-${etiqueta}`}
          onClick={() => acciones.abrirFicha(id, "producir")}
          className="inline-flex items-center gap-1 rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Play size={14} strokeWidth={1.9} /> Producir
        </button>
        <button
          data-testid={`ver-tomas-${etiqueta}`}
          onClick={() => acciones.abrirFicha(id, "tomas")}
          className="inline-flex items-center gap-1 rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Layers size={14} strokeWidth={1.9} /> Tomas ({plano.numero_tomas})
        </button>
        {plano.escena_id && (
          <button
          data-testid={`mover-antes-${etiqueta}`}
          aria-label="Mover antes"
          title="Mover antes"
          onClick={() => acciones.moverPlano(plano.id, "antes")}
          className={boton}
        >
          <ChevronLeft size={15} strokeWidth={1.9} />
          </button>
        )}
        {plano.escena_id && (
          <button
          data-testid={`mover-despues-${etiqueta}`}
          aria-label="Mover después"
          title="Mover después"
          onClick={() => acciones.moverPlano(plano.id, "despues")}
          className={boton}
        >
          <ChevronRight size={15} strokeWidth={1.9} />
          </button>
        )}
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

      {!plano.escena_id && (
        <div className="mt-2 border-t border-linea pt-2">
          <p className="text-[12px] leading-[16px] text-aviso">
            Sin escena: no entra en el montaje hasta que tenga una.
          </p>
          <select
            data-testid={`mover-a-escena-${etiqueta}`}
            defaultValue=""
            onChange={(e) => e.target.value && acciones.moverAEscena(plano.id, e.target.value)}
            className="mt-1 w-full rounded-control border border-linea bg-superficie px-2 py-1 text-[13px] leading-[18px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            <option value="">Mover a escena…</option>
            {acciones.escenas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
