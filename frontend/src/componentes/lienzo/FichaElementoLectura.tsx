import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { RepartoLienzo } from "../../tipos";

interface Props {
  entrada: RepartoLienzo;
  urlMedio: (medioId: string) => string;
  rutaPaso: string | null;
}

const ROLES: Record<string, string> = {
  frontal: "Frontal",
  perfil: "Perfil",
  espalda: "Espalda",
  detalle: "Detalle",
  entorno: "Entorno",
  otra: "Otra",
};

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="text-[13px] leading-[18px] font-semibold text-tinta">{titulo}</h3>
      <div className="mt-1 text-[14px] leading-[20px] text-tinta2">{children}</div>
    </section>
  );
}

// Ficha del elemento en modo lectura, desde el lienzo (§7.7b).
export default function FichaElementoLectura({ entrada, urlMedio, rutaPaso }: Props) {
  const ficha = entrada.ficha;
  const referencias = ficha?.referencias || [];
  const [ampliada, setAmpliada] = useState<number | null>(null);

  return (
    <div data-testid="ficha-elemento-lectura">
      <p className="text-[13px] leading-[18px] text-tinta2">
        Versión usada: <span className="font-semibold text-tinta">v{entrada.version_ficha}</span>
        {ficha?.estado === "aprobada" ? " · aprobada" : " · sin aprobar"}
      </p>

      {ficha?.descripcion && <Bloque titulo="Descripción">{ficha.descripcion}</Bloque>}

      <Bloque titulo="Rasgos fijos">
        {(ficha?.rasgos_fijos || []).length === 0 ? (
          <span className="text-tinta3">— sin rasgos —</span>
        ) : (
          <ul className="flex flex-col gap-1" data-testid="lectura-rasgos-fijos">
            {ficha!.rasgos_fijos.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque titulo="Rasgos variables">
        {(ficha?.rasgos_variables || []).length === 0 ? (
          <span className="text-tinta3">— sin rasgos —</span>
        ) : (
          <ul className="flex flex-col gap-1" data-testid="lectura-rasgos-variables">
            {ficha!.rasgos_variables.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        )}
      </Bloque>

      {typeof ficha?.personalidad === "string" && ficha.personalidad && (
        <Bloque titulo="Personalidad">{ficha.personalidad as string}</Bloque>
      )}

      <Bloque titulo="Referencias">
        {referencias.length === 0 ? (
          <span className="text-tinta3">— sin referencias —</span>
        ) : (
          <ul className="flex flex-wrap gap-2" data-testid="lectura-referencias">
            {referencias.map((r, i) => (
              <li key={i} className="w-20">
                <button
                  data-testid={`ampliar-referencia-${i}`}
                  onClick={() => setAmpliada(i)}
                  title="Ampliar"
                  className="block h-20 w-20 overflow-hidden rounded-control border border-linea bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  <img
                    src={urlMedio(r.medio_id)}
                    alt={ROLES[r.rol] || r.rol}
                    className="h-full w-full object-cover"
                  />
                </button>
                <span className="mt-1 block truncate text-[12px] leading-[16px] text-tinta2">
                  {ROLES[r.rol] || r.rol}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      {ampliada !== null && referencias[ampliada] && (
        <div
          data-testid="referencia-ampliada"
          role="dialog"
          aria-label="Referencia ampliada"
          onClick={() => setAmpliada(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/60 p-8"
        >
          <img
            src={urlMedio(referencias[ampliada].medio_id)}
            alt={ROLES[referencias[ampliada].rol] || referencias[ampliada].rol}
            className="max-h-full max-w-full rounded-panel object-contain"
          />
        </div>
      )}

      {rutaPaso && (
        <Link
          to={rutaPaso}
          data-testid="editar-en-su-paso"
          className="mt-5 inline-block text-[14px] leading-[20px] text-acento underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          Editar en su paso
        </Link>
      )}
    </div>
  );
}
