import React from "react";
import Dialogo from "../Dialogo";
import Boton from "../Boton";
import type { AvisoEncadenado } from "../../tipos";

interface Props {
  avisos: AvisoEncadenado[];
  etiquetaDe: (planoId: string) => string;
  onDesencadenar: (planoId: string) => Promise<unknown>;
  onDeshacer: (() => Promise<unknown>) | null;
  onCerrar: () => void;
}

// §13: un plano encadenado que se queda sin anterior, o que cambia de anterior, se
// avisa y lo decide el usuario. Nada se cambia solo.
export default function AvisosEncadenado({
  avisos,
  etiquetaDe,
  onDesencadenar,
  onDeshacer,
  onCerrar,
}: Props) {
  return (
    <Dialogo
      abierto
      onCerrar={onCerrar}
      titulo="Planos encadenados afectados"
      ancho="max-w-[560px]"
      data-testid="avisos-encadenado"
    >
      <p className="text-[15px] leading-[22px] text-tinta">
        Estos planos estaban encadenados con el plano anterior. Decide qué hacer: no se ha
        cambiado nada.
      </p>
      <ul className="mt-5 flex flex-col gap-4">
        {avisos.map((a) => (
          <li
            key={a.plano_id}
            data-testid={`aviso-encadenado-${a.plano_id}`}
            className="rounded-card border border-linea bg-superficie2 p-4"
          >
            <p className="text-[15px] leading-[22px] font-semibold text-tinta">
              Plano {etiquetaDe(a.plano_id)}
            </p>
            <p className="mt-1 text-[14px] leading-[20px] text-tinta2">
              {a.es_primero
                ? "Ahora es el primero de su escena: no hay plano anterior con el que encadenarlo."
                : `Su plano anterior ahora es ${etiquetaDe(a.anterior_ahora || "")}.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Boton
                pequeno
                data-testid={`desencadenar-${a.plano_id}`}
                onClick={async () => {
                  await onDesencadenar(a.plano_id);
                }}
              >
                Desencadenar
              </Boton>
              {!a.es_primero && (
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid={`mantener-${a.plano_id}`}
                  onClick={onCerrar}
                >
                  Mantener encadenado
                </Boton>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        {onDeshacer && (
          <Boton
            variante="secundario"
            data-testid="btn-deshacer-movimiento"
            onClick={async () => {
              await onDeshacer();
              onCerrar();
            }}
          >
            Deshacer el movimiento
          </Boton>
        )}
        <Boton variante="texto" data-testid="btn-dejarlo-asi" onClick={onCerrar}>
          Dejarlo así
        </Boton>
      </div>
    </Dialogo>
  );
}
