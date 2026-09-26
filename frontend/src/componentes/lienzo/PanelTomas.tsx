import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Columns2, Sparkles } from "lucide-react";
import Boton from "../Boton";
import Selector from "../Selector";
import { Campo, Entrada } from "../Campo";
import { api } from "../../api/cliente";
import { formatoMoneda } from "../../lib/formato";
import { VistaMedio, costeEstimado, textoCoste } from "../motor/comun";
import type { ModeloCatalogo, Plano, Toma } from "../../tipos";

interface Props {
  plano: Plano;
  relacion: string;
  moneda: string;
  onCambiado: () => void | Promise<unknown>;
}

export default function PanelTomas({ plano, relacion, moneda, onCambiado }: Props) {
  const [comparar, setComparar] = useState<string[]>([]);
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [instruccion, setInstruccion] = useState("");
  const [modeloAjuste, setModeloAjuste] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["tomas", plano.id],
    queryFn: () => api.tomas(plano.id),
    refetchInterval: 4000,
  });
  const { data: catalogo } = useQuery({
    queryKey: ["catalogo", "editar_imagen"],
    queryFn: () => api.catalogo("editar_imagen"),
  });

  const modelosEdicion = (catalogo || []).filter((m) => m.elegible);
  const modelo: ModeloCatalogo | null =
    modelosEdicion.find((m) => m.id === modeloAjuste) || modelosEdicion[0] || null;
  const costeAjuste = costeEstimado(modelo, { variantes: 1 });

  const tomas = data?.tomas || [];
  const exploraciones = data?.exploraciones || [];
  const elegidaId = data?.toma_elegida_id || null;
  const comparadas = tomas.filter((t) => comparar.includes(t.id));

  const alternarComparar = (id: string) =>
    setComparar((previo) =>
      previo.includes(id) ? previo.filter((x) => x !== id) : [...previo, id].slice(-2)
    );

  const elegir = async (toma: Toma) => {
    await api.elegirToma(toma.id);
    await refetch();
    await onCambiado();
  };

  const ajustar = async (toma: Toma) => {
    if (!modelo || !instruccion.trim()) return;
    setError(null);
    try {
      const prep = await api.ajustarToma(toma.id, {
        destino_id: plano.id,
        accion: "editar_imagen",
        modelo: modelo.id,
        instruccion: instruccion.trim(),
      });
      await api.autorizarOperacion(prep.operacion.id, true);
      setAjustando(null);
      setInstruccion("");
      await refetch();
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido ajustar.");
    }
  };

  const ficha = (toma: Toma, exploracion: boolean) => (
    <li
      key={toma.id}
      data-testid={`toma-${toma.numero}${exploracion ? "-exploracion" : ""}`}
      className={
        "rounded-card border p-2 " +
        (toma.id === elegidaId ? "border-acento bg-acentoSuave" : "border-linea bg-superficie")
      }
    >
      <VistaMedio
        medio={toma.medio}
        url={api.urlMedio}
        relacion={relacion}
        testid={`medio-toma-${toma.numero}`}
      />
      <div className="mt-2 flex items-center justify-between gap-2 text-[12px] leading-[16px]">
        <span className="text-tinta">
          {exploracion ? "Exploración" : "Toma"} {toma.numero}
          {toma.id === elegidaId && <strong className="ml-1 text-acentoTinta">· elegida</strong>}
        </span>
        <span className="text-tinta3">{toma.modelo}</span>
      </div>
      {toma.exploracion && (
        <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
          {[toma.exploracion.encuadre, toma.exploracion.angulo].filter(Boolean).join(" · ")}
        </p>
      )}
      {toma.nota && <p className="mt-1 text-[12px] leading-[16px] text-tinta3">{toma.nota}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {exploracion ? (
          <>
            {plano.modalidad === "video" ? (
              <>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid={`fijar-inicio-${toma.numero}`}
                  onClick={async () => {
                    await api.fijarExploracion(toma.id, "inicio");
                    await onCambiado();
                  }}
                >
                  Fijar como inicio
                </Boton>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid={`fijar-final-${toma.numero}`}
                  onClick={async () => {
                    await api.fijarExploracion(toma.id, "final");
                    await onCambiado();
                  }}
                >
                  Fijar como final
                </Boton>
              </>
            ) : (
              <Boton
                pequeno
                variante="secundario"
                data-testid={`fijar-${toma.numero}`}
                onClick={async () => {
                  await api.fijarExploracion(toma.id, "inicio");
                  await onCambiado();
                }}
              >
                Fijar este encuadre
              </Boton>
            )}
            <Boton
              pequeno
              variante="texto"
              data-testid={`usar-como-toma-${toma.numero}`}
              onClick={async () => {
                await api.usarExploracionComoToma(toma.id);
                await refetch();
                await onCambiado();
              }}
            >
              Usar como toma del plano
            </Boton>
          </>
        ) : (
          <>
            <Boton
              pequeno
              data-testid={`elegir-toma-${toma.numero}`}
              disabled={toma.id === elegidaId}
              onClick={() => elegir(toma)}
            >
              <Check size={13} strokeWidth={1.9} /> Elegir
            </Boton>
            <Boton
              pequeno
              variante="secundario"
              aria-pressed={comparar.includes(toma.id)}
              data-testid={`comparar-toma-${toma.numero}`}
              onClick={() => alternarComparar(toma.id)}
            >
              <Columns2 size={13} strokeWidth={1.9} /> Comparar
            </Boton>
            {toma.medio?.clase === "imagen" && (
              <Boton
                pequeno
                variante="texto"
                data-testid={`ajustar-toma-${toma.numero}`}
                onClick={() => setAjustando(ajustando === toma.id ? null : toma.id)}
              >
                <Sparkles size={13} strokeWidth={1.9} /> Ajustar
              </Boton>
            )}
            <Selector
              data-testid={`valorar-toma-${toma.numero}`}
              valor={toma.valoracion || "ninguna"}
              opciones={[
                { valor: "ninguna", texto: "sin valorar" },
                { valor: "buena", texto: "buena" },
                { valor: "descartada", texto: "descartada" },
              ]}
              onChange={async (v) => {
                await api.valorarToma(toma.id, { valoracion: v });
                await refetch();
              }}
            />
          </>
        )}
      </div>

      {ajustando === toma.id && (
        <div className="mt-2 rounded-control border border-linea bg-superficie2 p-2">
          <Campo etiqueta="Qué hay que ajustar" ayuda="«baja la saturación», «quita el fondo».">
            <Entrada
              data-testid="ajuste-instruccion"
              value={instruccion}
              onChange={(e) => setInstruccion(e.target.value)}
            />
          </Campo>
          {modelosEdicion.length > 1 && (
            <Campo etiqueta="Modelo">
              <Selector
                data-testid="ajuste-modelo"
                valor={modelo?.id || ""}
                opciones={modelosEdicion.map((m) => ({ valor: m.id, texto: m.nombre_visible }))}
                onChange={setModeloAjuste}
              />
            </Campo>
          )}
          <Boton
            pequeno
            className="mt-2"
            data-testid="btn-ajustar"
            disabled={!instruccion.trim() || !modelo}
            onClick={() => ajustar(toma)}
          >
            {costeAjuste === null
              ? "Ajustar (coste sin verificar)"
              : `Ajustar por ${formatoMoneda(costeAjuste, moneda)}`}
          </Boton>
          <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
            El resultado es una toma nueva. La original se conserva.
          </p>
        </div>
      )}
    </li>
  );

  return (
    <div className="mt-4" data-testid="panel-tomas">
      {error && <p className="mb-2 text-[13px] leading-[18px] text-aviso">{error}</p>}

      {comparadas.length === 2 && (
        <div className="mb-4" data-testid="comparacion-tomas">
          <h3 className="text-[14px] leading-[20px] font-semibold text-tinta">
            Comparar tomas {comparadas[0].numero} y {comparadas[1].numero}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {comparadas.map((t) => (
              <div key={t.id}>
                <VistaMedio
                  medio={t.medio}
                  url={api.urlMedio}
                  relacion={relacion}
                  testid={`comparar-medio-${t.numero}`}
                />
                <Boton
                  pequeno
                  className="mt-2 w-full"
                  data-testid={`elegir-comparada-${t.numero}`}
                  disabled={t.id === elegidaId}
                  onClick={() => elegir(t)}
                >
                  Elegir la {t.numero}
                </Boton>
              </div>
            ))}
          </div>
          <Boton
            pequeno
            variante="texto"
            className="mt-2"
            data-testid="cerrar-comparacion"
            onClick={() => setComparar([])}
          >
            Cerrar la comparación
          </Boton>
        </div>
      )}

      <ul className="flex flex-col gap-3" data-testid="lista-tomas">
        {tomas.length === 0 && (
          <li className="text-[14px] leading-[20px] text-tinta3">
            Este plano todavía no tiene tomas. Se producen en la pestaña «Producir».
          </li>
        )}
        {tomas.map((t) => ficha(t, false))}
      </ul>

      {exploraciones.length > 0 && (
        <div className="mt-5 border-t border-linea pt-4">
          <h3 className="text-[14px] leading-[20px] font-semibold text-tinta">
            Lámina de encuadres ({exploraciones.length})
          </h3>
          <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
            Tomas de exploración: van aparte de las tomas del plano.
          </p>
          <ul className="mt-2 flex flex-col gap-3" data-testid="lista-exploraciones">
            {exploraciones.map((t) => ficha(t, true))}
          </ul>
        </div>
      )}
    </div>
  );
}
