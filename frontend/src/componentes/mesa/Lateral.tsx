import React from "react";
import { Star, X } from "lucide-react";
import { api } from "../../api/cliente";
import { textoImporte } from "../motor/comun";
import { formatoMoneda } from "../../lib/formato";
import { linaje } from "../../lib/mesa";

export type Pestana = "imagen" | "director";

interface Props {
  pestana: Pestana;
  onPestana: (p: Pestana) => void;
  onCerrar: () => void;
  toma: any | null;
  tomas: any[];
  nombresRef: Record<string, string>;
  nombreModelo: (id: string | null | undefined) => string;
  alcance: string;
  onFavorita: () => void;
  onDescartar: () => void;
  onNota: (nota: string) => void;
  onComparar: () => void;
  otraComoEsta: { texto: string; desactivado: boolean; onClick: () => void } | null;
}

const ESTADO_CARGO: Record<string, string> = { pendiente: "posible cargo sin confirmar", sin_cargo: "sin cargo", cobrado: "cobrado" };

function Pestanas({ pestana, onPestana, onCerrar, etiquetaImagen }: { pestana: Pestana; onPestana: (p: Pestana) => void; onCerrar: () => void; etiquetaImagen: string }) {
  const clase = (activa: boolean) =>
    "h-9 rounded-t-[8px] px-3 text-[13px] " +
    (activa ? "bg-superficie2 font-extrabold text-tinta shadow-[inset_0_-2px_0_var(--color-acento)]" : "font-semibold text-tinta2");
  return (
    <div role="tablist" className="flex items-center gap-1 border-b border-linea px-2.5 pt-2.5">
      <button role="tab" aria-selected={pestana === "imagen"} data-testid="lateral-pestana-imagen" className={clase(pestana === "imagen")} onClick={() => onPestana("imagen")}>
        {etiquetaImagen}
      </button>
      <button role="tab" aria-selected={pestana === "director"} data-testid="lateral-pestana-director" className={clase(pestana === "director")} onClick={() => onPestana("director")}>
        Director de Studio
      </button>
      <button aria-label="Cerrar el lateral" data-testid="lateral-cerrar" onClick={onCerrar} className="mb-1.5 ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-superficie2">
        <X size={15} />
      </button>
    </div>
  );
}

export default function Lateral(p: Props) {
  const t = p.toma;
  const cadena = t ? linaje(t.id, p.tomas) : [];
  const origen = cadena.length > 1 ? cadena[cadena.length - 2] : null;
  const etiqueta = (x: any) => `V${x.numero}`;
  const nombre = (id: string) => p.nombresRef[id] || "referencia";
  const enviadas: string[] = t
    ? [
        ...(t.enviadas?.imagen ? [`imagen ${etiqueta(p.tomas.find((x) => x.medio_id === t.enviadas.imagen) || { numero: "?" })}`] : []),
        ...(t.enviadas?.referencias || []).map((id: string) => `@${nombre(id)}`),
      ]
    : [];
  const conRefs = cadena.slice(0, -1).reverse().find((x) => (x.enviadas?.referencias || []).length);
  const delLinaje = conRefs ? conRefs.enviadas.referencias.map((id: string) => `@${nombre(id)} (de ${etiqueta(conRefs)})`) : [];
  const coste = t?.coste;

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-linea bg-superficie" data-testid="lateral">
      <Pestanas pestana={p.pestana} onPestana={p.onPestana} onCerrar={p.onCerrar} etiquetaImagen={t ? `Imagen · ${etiqueta(t)}` : "Imagen"} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {p.pestana === "imagen" && !t && (
          <p className="text-[13px] leading-[19px] text-tinta2">Ninguna versión seleccionada. Pulsa una en la Mesa para verla aquí.</p>
        )}
        {p.pestana === "imagen" && t && (
          <div className="flex flex-col gap-3" data-testid="inspector">
            <div className="flex items-baseline gap-2">
              <b className="text-[16px]">{etiqueta(t)}</b>
              <span className="text-[12px] text-tinta2">{cadena.map(etiqueta).join(" → ")}</span>
            </div>
            <div className="flex max-h-[300px] items-center justify-center overflow-hidden rounded-card bg-mesa">
              {t.medio && <img data-testid="inspector-imagen" src={api.urlMedio(t.medio.id)} alt={etiqueta(t)} className="max-h-[300px] w-full object-contain" />}
            </div>
            {t.accion === "editar_imagen" && t.texto && (
              <div className="rounded-control border border-linea bg-mesa p-2.5 text-[13px] leading-[18px]" data-testid="inspector-cambio">
                <span className="text-tinta2">Cambio pedido{origen ? ` desde ${etiqueta(origen)}` : ""}:</span> {t.texto}
              </div>
            )}
            <div className="flex gap-2">
              <button data-testid="inspector-favorita" onClick={p.onFavorita} className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-control border border-linea bg-superficie2 text-[13px]">
                <Star size={14} fill={t.valoracion === "buena" ? "currentColor" : "none"} className={t.valoracion === "buena" ? "text-acento" : ""} />
                {t.valoracion === "buena" ? "Favorita" : "Me la quedo"}
              </button>
              <button data-testid="inspector-descartar" onClick={p.onDescartar} className="h-[38px] flex-1 rounded-control border border-linea bg-superficie2 text-[13px]">
                {t.valoracion === "descartada" ? "Recuperar" : "Descartar"}
              </button>
            </div>
            {origen && (
              <button data-testid="inspector-comparar" onClick={p.onComparar} className="h-[38px] rounded-control border-[1.5px] border-linea bg-superficie2 text-[13px] font-bold">
                Comparar con el origen ({etiqueta(origen)})
              </button>
            )}
            {p.otraComoEsta && (
              <button disabled={p.otraComoEsta.desactivado} onClick={p.otraComoEsta.onClick} className="h-[38px] rounded-control border border-linea bg-superficie2 text-[13px] disabled:opacity-40">
                {p.otraComoEsta.texto}
              </button>
            )}
            <div className="rounded-control bg-mesa p-2.5 text-[12px] leading-[17px]" data-testid="inspector-referencias">
              <b>Enviado en esta operación:</b> {enviadas.length ? enviadas.join(", ") : "solo el texto"}
              <br />
              <span className="text-tinta2">
                <b className="text-tinta">Del linaje</b> (no enviado aquí): {delLinaje.length ? delLinaje.join(", ") : origen ? "ninguna" : "ninguna (es el origen)"}
              </span>
            </div>
            <details open>
              <summary className="cursor-pointer text-[13px] font-bold text-acento">Cómo se hizo</summary>
              <div className="mt-1.5 flex flex-col gap-1.5 text-[12px] leading-[17px] text-tinta2" data-testid="inspector-como">
                <span>
                  {p.nombreModelo(t.modelo)} · {t.relacion} ·{" "}
                  {coste ? `${coste.estimado !== null ? formatoMoneda(coste.estimado, "USD") + " estimado" : "sin precio"} · ${textoImporte(coste, "USD")}` : "—"}
                </span>
                {(coste?.cargos || []).map((c: any) => (
                  <span key={c.intento_id} className="text-aviso">
                    Intento {c.numero}: {ESTADO_CARGO[c.estado] || c.estado}
                    {c.importe !== null ? ` · ${formatoMoneda(c.importe, "USD")}` : c.estimado !== null ? ` · ${formatoMoneda(c.estimado, "USD")}` : ""}
                  </span>
                ))}
                {Object.keys(t.direccion || {}).length > 0 && (
                  <span><b className="text-tinta">Dirección:</b> {Object.values(t.direccion).join(" · ")}</span>
                )}
                <span><b className="text-tinta">Escribiste:</b> {t.texto || "—"}</span>
                <span className="whitespace-pre-wrap"><b className="text-tinta">Se envió:</b> {t.prompt_enviado || "—"}</span>
                <span>{new Date(t.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
            </details>
            <label className="text-[12px] text-tinta2">
              Nota
              <textarea
                key={t.id}
                data-testid="inspector-nota"
                placeholder="Qué funcionó o qué falla"
                defaultValue={t.nota || ""}
                onBlur={(e) => e.target.value !== (t.nota || "") && p.onNota(e.target.value)}
                className="mt-1 block h-[52px] w-full resize-none rounded-control border border-linea bg-superficie2 p-2 text-[13px] text-tinta outline-none focus:border-acento"
              />
            </label>
            <span className="text-[12px] leading-[17px] text-tinta2">Para cambiar esta versión, escribe abajo: el alcance ya dice «{p.alcance}».</span>
          </div>
        )}
        {p.pestana === "director" && (
          <div className="flex flex-col gap-3" data-testid="director">
            <div className="rounded-control border border-linea bg-mesa px-2.5 py-2 text-[12px] leading-[17px] text-tinta2">
              Trabajando sobre: <b className="text-tinta">{p.alcance}</b>
              {t ? " · la selección se conserva al cambiar de pestaña" : ""}
            </div>
            <p className="text-[13px] leading-[19px] text-tinta">El Director de Studio todavía no está disponible.</p>
            <p className="text-[12px] leading-[18px] text-tinta2">
              Tendrá su propia especificación: orientará según el trabajo (fotografía, publicidad o cine) y sus sugerencias prepararán cambios que tú revisas, sin generar ni gastar. Hasta entonces, la dirección se ajusta a mano con «Dirección» en la barra.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
