import React, { useRef, useState } from "react";
import { Check, Pause, Play, X } from "lucide-react";
import Boton from "../Boton";
import { api } from "../../api/cliente";
import type { Toma } from "../../tipos";

interface Props {
  relacion: string; // relación de aspecto del proyecto, p. ej. "16 / 9"
  tomas: Toma[];
  elegidaId: string | null;
  onElegir: (toma: Toma) => void | Promise<unknown>;
  onCerrar: () => void;
}

/** Comparar tomas a pantalla completa (§22): las dos enteras, grandes y sin
 * recortar. En vídeo, las dos se reproducen a la vez para poder compararlas. */
export default function ComparadorTomas({
  relacion,
  tomas,
  elegidaId,
  onElegir,
  onCerrar,
}: Props) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [enMarcha, setEnMarcha] = useState(false);
  const hayVideo = tomas.some((t) => t.medio?.clase === "video");

  const sincronizar = (accion: "play" | "pause" | "inicio") => {
    videos.current.forEach((v) => {
      if (!v) return;
      if (accion === "inicio") {
        v.currentTime = 0;
        return;
      }
      if (accion === "play") void v.play();
      else v.pause();
    });
    if (accion !== "inicio") setEnMarcha(accion === "play");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-fondo px-6 py-8"
      data-testid="comparador-tomas"
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] leading-[18px] text-tinta2">Comparar tomas</p>
            <h1 className="text-[26px] leading-[34px] font-semibold text-tinta">
              Toma {tomas[0]?.numero} y toma {tomas[1]?.numero}
            </h1>
            <p className="mt-1 text-[14px] leading-[20px] text-tinta2">
              Las dos enteras y al mismo tamaño. Elige la que se queda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hayVideo && (
              <>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="comparador-reproducir"
                  onClick={() => sincronizar(enMarcha ? "pause" : "play")}
                >
                  {enMarcha ? (
                    <>
                      <Pause size={15} strokeWidth={1.9} /> Pausar las dos
                    </>
                  ) : (
                    <>
                      <Play size={15} strokeWidth={1.9} /> Reproducir las dos
                    </>
                  )}
                </Boton>
                <Boton
                  pequeno
                  variante="texto"
                  data-testid="comparador-volver-al-inicio"
                  onClick={() => sincronizar("inicio")}
                >
                  Volver al inicio
                </Boton>
              </>
            )}
            <button
              data-testid="cerrar-comparador"
              onClick={onCerrar}
              aria-label="Cerrar la comparación"
              className="flex h-11 w-11 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {tomas.map((toma, i) => (
            <div key={toma.id} data-testid={`comparador-columna-${toma.numero}`}>
              <div
                className="flex items-center justify-center overflow-hidden rounded-card border border-linea bg-superficie2"
                style={{ aspectRatio: relacion }}
              >
                {toma.medio?.clase === "video" ? (
                  <video
                    ref={(el) => {
                      videos.current[i] = el;
                    }}
                    data-testid={`comparador-medio-${toma.numero}`}
                    src={toma.medio ? api.urlMedio(toma.medio.id) : undefined}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    data-testid={`comparador-medio-${toma.numero}`}
                    src={toma.medio ? api.urlMedio(toma.medio.id) : undefined}
                    alt={`Toma ${toma.numero}`}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base leading-[24px] font-medium text-tinta">
                    Toma {toma.numero}
                    {toma.id === elegidaId && (
                      <span className="ml-2 text-acentoTinta">· elegida</span>
                    )}
                  </p>
                  <p className="text-[13px] leading-[18px] text-tinta2">
                    {toma.modelo}
                    {toma.nota ? ` · ${toma.nota}` : ""}
                  </p>
                </div>
                <Boton
                  data-testid={`comparador-elegir-${toma.numero}`}
                  disabled={toma.id === elegidaId}
                  onClick={() => onElegir(toma)}
                >
                  <Check size={15} strokeWidth={1.9} /> Elegir la {toma.numero}
                </Boton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
