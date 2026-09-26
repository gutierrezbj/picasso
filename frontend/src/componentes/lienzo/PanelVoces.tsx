import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Mic } from "lucide-react";
import Boton from "../Boton";
import Selector from "../Selector";
import { Campo, Entrada } from "../Campo";
import { api } from "../../api/cliente";
import { formatoMoneda } from "../../lib/formato";
import { ETIQUETA_ESTADO, colorEstado, costeEstimado, textoCoste } from "../motor/comun";
import type { ModeloCatalogo, Plano, VocesEscena, VozDialogoVista } from "../../tipos";

// Pestaña «Voces» de la ficha del plano (§11.1): los diálogos de su escena, cada
// uno con sus tomas de voz, la elegida, el plano donde suena y el desfase.

interface Props {
  plano: Plano;
  onCambiado: () => void | Promise<unknown>;
}

const EN_MARCHA = ["autorizada", "enviada", "en_curso"];

export default function PanelVoces({ plano, onCambiado }: Props) {
  const escenaId = plano.escena_id;
  const { data, refetch } = useQuery({
    queryKey: ["voces", escenaId],
    queryFn: () => api.vocesEscena(escenaId as string),
    enabled: !!escenaId,
    refetchInterval: 3000,
  });
  const { data: catalogo } = useQuery({
    queryKey: ["catalogo", "generar_voz"],
    queryFn: () => api.catalogo("generar_voz"),
  });
  const { data: produccion } = useQuery({
    queryKey: ["produccion", plano.id],
    queryFn: () => api.produccion(plano.id),
    refetchInterval: 4000,
  });

  if (!escenaId) {
    return (
      <p className="mt-4 text-[14px] text-tinta2" data-testid="voces-sin-escena">
        Este plano no tiene escena: sus voces aparecerán cuando lo muevas a una.
      </p>
    );
  }
  const voces = data?.voces || [];
  const modelos = (catalogo || []).filter((m) => m.elegible);

  return (
    <div className="mt-4 flex flex-col gap-5" data-testid="pestana-voces-contenido">
      {voces.length === 0 && (
        <p className="text-[14px] text-tinta2">
          La escena no tiene diálogos. Se escriben en el guion; al aprobarlo aparecen aquí.
        </p>
      )}
      {voces.map((voz) => (
        <TarjetaVoz
          key={voz.dialogo_id}
          voz={voz}
          escena={data as VocesEscena}
          modelos={modelos}
          restante={produccion?.presupuesto.presupuesto_restante ?? null}
          moneda={produccion?.presupuesto.moneda || "USD"}
          onCambiado={async () => {
            await refetch();
            await onCambiado();
          }}
        />
      ))}
    </div>
  );
}

interface PropsTarjeta {
  voz: VozDialogoVista;
  escena: VocesEscena;
  modelos: ModeloCatalogo[];
  restante: number | null;
  moneda: string;
  onCambiado: () => Promise<void>;
}

function TarjetaVoz({ voz, escena, modelos, restante, moneda, onCambiado }: PropsTarjeta) {
  const [modeloId, setModeloId] = useState("");
  const [desfase, setDesfase] = useState(String(voz.desfase_s));
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDesfase(String(voz.desfase_s)), [voz.desfase_s]);

  const { data: operaciones } = useQuery({
    queryKey: ["operaciones", voz.dialogo_id],
    queryFn: () => api.operaciones({ destino_id: voz.dialogo_id }),
    refetchInterval: 3000,
  });
  const ultima = (operaciones || [])[0];
  const enMarcha = ultima && EN_MARCHA.includes(ultima.estado);

  const modelo = modelos.find((m) => m.id === modeloId) || modelos[0] || null;
  const coste = costeEstimado(modelo, { texto: voz.texto });
  const vacio = !voz.texto.trim();

  const producir = async (confirmado: boolean) => {
    if (!modelo) return;
    if (!confirmado && restante !== null && coste !== null && coste > restante) {
      setAviso(coste);
      return;
    }
    setTrabajando(true);
    setError(null);
    try {
      const prep = await api.prepararOperacion({
        destino_tipo: "dialogo",
        destino_id: voz.dialogo_id,
        accion: "generar_voz",
        modelo: modelo.id,
      });
      await api.autorizarOperacion(prep.operacion.id, confirmado);
      setAviso(null);
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido producir la voz.");
    } finally {
      setTrabajando(false);
    }
  };

  const guardar = async (datos: { plano_id?: string; desfase_s?: number }) => {
    setError(null);
    try {
      await api.editarVoz(voz.dialogo_id, datos);
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido guardar.");
    }
  };

  const elegir = async (tomaId: string) => {
    setError(null);
    try {
      await api.elegirToma(tomaId);
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido elegir.");
    }
  };

  return (
    <section
      className="flex flex-col gap-3 rounded-card bg-superficie2 p-4"
      data-testid={`voz-${voz.dialogo_id}`}
    >
      <div className="flex items-start gap-2">
        <Mic size={18} strokeWidth={1.9} className="mt-0.5 shrink-0 text-tinta2" aria-hidden />
        <div>
          <p className="text-[14px] font-medium text-tinta">{voz.hablante_nombre}</p>
          <p className="text-[16px] leading-[24px] text-tinta">
            {vacio ? <span className="text-tinta3">— diálogo vacío —</span> : `«${voz.texto}»`}
          </p>
        </div>
      </div>

      {voz.avisos.map((a) => (
        <p key={a} className="flex items-start gap-2 text-[14px] text-aviso" data-testid="voz-aviso">
          <AlertTriangle size={16} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
          {a}
        </p>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Suena en">
          <Selector
            data-testid="voz-plano"
            valor={voz.plano_id || ""}
            onChange={(v) => guardar({ plano_id: v })}
            opciones={escena.planos.map((p) => ({
              valor: p.id,
              texto: `${p.etiqueta}${p.duracion_s ? ` · ${String(p.duracion_s).replace(".", ",")} s` : ""}`,
            }))}
          />
        </Campo>
        <Campo etiqueta="Desfase (s)" ayuda="Desde el inicio del plano.">
          <Entrada
            data-testid="voz-desfase"
            type="number"
            min={0}
            step={0.1}
            value={desfase}
            onChange={(e) => setDesfase(e.target.value)}
            onBlur={() => {
              const n = Number(desfase);
              if (!Number.isNaN(n) && n >= 0 && n !== voz.desfase_s) guardar({ desfase_s: n });
            }}
          />
        </Campo>
      </div>

      {voz.tomas.length > 0 && (
        <ul className="flex flex-col gap-2" data-testid="voz-tomas">
          {voz.tomas.map((t) => {
            const elegida = t.id === voz.toma_elegida_id;
            return (
              <li key={t.id} className="flex flex-col gap-1 rounded-control bg-superficie p-3">
                <div className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="font-medium text-tinta">
                    Toma {t.numero}
                    {t.duracion_s ? ` · ${String(t.duracion_s).replace(".", ",")} s` : ""}
                  </span>
                  {elegida ? (
                    <span className="flex items-center gap-1 text-exito" data-testid="voz-elegida">
                      <Check size={16} strokeWidth={2} aria-hidden /> Elegida
                    </span>
                  ) : (
                    <Boton variante="secundario" pequeno onClick={() => elegir(t.id)}>
                      Elegir
                    </Boton>
                  )}
                </div>
                {!t.texto_actual && (
                  <p className="text-[13px] text-aviso">Se produjo con otro texto: «{t.texto_usado}»</p>
                )}
                <audio src={api.urlMedio(t.medio_id)} controls className="w-full" />
              </li>
            );
          })}
        </ul>
      )}

      {enMarcha ? (
        <p className={`text-[14px] ${colorEstado(ultima.estado)}`} data-testid="voz-en-marcha">
          Produciendo la voz · {ETIQUETA_ESTADO[ultima.estado] || ultima.estado}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ultima && (ultima.estado === "incierta" || ultima.estado === "fallida") && (
            <p className={`text-[14px] ${colorEstado(ultima.estado)}`}>
              La última voz quedó {ETIQUETA_ESTADO[ultima.estado]}. Recupérala desde el Registro.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            {modelos.length > 1 && (
              <div className="min-w-[200px] flex-1">
                <Campo etiqueta="Modelo de voz">
                  <Selector
                    valor={modelo?.id || ""}
                    onChange={setModeloId}
                    opciones={modelos.map((m) => ({ valor: m.id, texto: m.nombre_visible }))}
                  />
                </Campo>
              </div>
            )}
            <Boton
              data-testid="voz-producir"
              disabled={trabajando || vacio || !modelo}
              onClick={() => producir(false)}
            >
              {voz.tomas.length ? "Otra toma" : "Producir voz"} por {textoCoste(coste, moneda)}
            </Boton>
          </div>
          {modelo && !modelo.coste.verificado && (
            <span className="text-[13px] text-tinta2">precio simulado</span>
          )}
          {vacio && <span className="text-[13px] text-tinta2">Escribe el diálogo en el guion para poder producirlo.</span>}
        </div>
      )}

      {aviso !== null && (
        <div className="flex flex-col gap-2 rounded-control bg-superficie p-3" data-testid="voz-aviso-presupuesto">
          <p className="text-[14px] text-tinta">
            Esta voz cuesta {textoCoste(aviso, moneda)} y del presupuesto quedan{" "}
            {formatoMoneda(restante || 0, moneda)}.
          </p>
          <div className="flex gap-2">
            <Boton pequeno onClick={() => producir(true)}>
              Producir igualmente
            </Boton>
            <Boton variante="secundario" pequeno onClick={() => setAviso(null)}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}

      {error && <p className="text-[14px] text-error">{error}</p>}
    </section>
  );
}
