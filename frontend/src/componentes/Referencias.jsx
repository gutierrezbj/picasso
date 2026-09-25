import React, { useState } from "react";
import { X, Images, Maximize2 } from "lucide-react";
import Boton from "./Boton";
import Dialogo from "./Dialogo";
import Selector from "./Selector";
import SubidorMedios from "./SubidorMedios";
import { api } from "../api/cliente";

const ROLES = [
  { valor: "frontal", texto: "Frontal" },
  { valor: "perfil", texto: "Perfil" },
  { valor: "espalda", texto: "Espalda" },
  { valor: "detalle", texto: "Detalle" },
  { valor: "entorno", texto: "Entorno" },
  { valor: "otra", texto: "Otra" },
];

// Referencias de una ficha (§3.1): medios del espacio con su rol.
export default function Referencias({
  referencias = [],
  medios = [],
  editable,
  onCambiar,
  espacioId,
  onMediosNuevos,
}) {
  const [picker, setPicker] = useState(false);
  const [visor, setVisor] = useState(null);
  const porId = Object.fromEntries(medios.map((m) => [m.id, m]));
  const yaUsados = new Set(referencias.map((r) => r.medio_id));
  const disponibles = medios.filter((m) => m.clase === "imagen" && !yaUsados.has(m.id));

  const anadir = (medioId) => {
    if (yaUsados.has(medioId)) return;
    onCambiar([...referencias, { medio_id: medioId, rol: "otra" }]);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="bloque-referencias">
      {referencias.length === 0 ? (
        <p className="text-[14px] leading-[20px] text-tinta3">
          Sin referencias todavía.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {referencias.map((r, i) => {
            const m = porId[r.medio_id];
            return (
              <li
                key={r.medio_id}
                className="overflow-hidden rounded-card border border-linea bg-superficie"
                data-testid={`referencia-${i}`}
              >
                <div className="aspect-[4/3] w-full bg-superficie2">
                  {m ? (
                    <button
                      data-testid={`referencia-abrir-${i}`}
                      onClick={() => setVisor(r.medio_id)}
                      aria-label={`Ver completa ${m.nombre_original || "la referencia"}`}
                      className="group relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                    >
                      <img
                        src={api.urlMedio(r.medio_id)}
                        alt={m.nombre_original || "Referencia"}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-control bg-superficie/90 text-tinta2 opacity-0 transition-opacity duration-[120ms] ease-suave group-hover:opacity-100">
                        <Maximize2 size={15} strokeWidth={1.9} />
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-[13px] text-tinta3">
                      Medio no encontrado
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2">
                  {editable ? (
                    <>
                      <Selector
                        data-testid={`referencia-rol-${i}`}
                        valor={r.rol}
                        onChange={(v) =>
                          onCambiar(referencias.map((x, j) => (j === i ? { ...x, rol: v } : x)))
                        }
                        opciones={ROLES}
                      />
                      <button
                        data-testid={`referencia-quitar-${i}`}
                        aria-label="Quitar referencia"
                        onClick={() => onCambiar(referencias.filter((_, j) => j !== i))}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                      >
                        <X size={16} strokeWidth={1.9} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[13px] leading-[18px] text-tinta2">
                      {(ROLES.find((x) => x.valor === r.rol) || {}).texto || r.rol}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className="flex flex-wrap items-start gap-3">
          <SubidorMedios
            espacioId={espacioId}
            acepta="image/*"
            texto="Subir referencia"
            testid="subir-referencia"
            onSubido={(creados) => {
              onMediosNuevos?.(creados);
              onCambiar([
                ...referencias,
                ...creados.map((m) => ({ medio_id: m.id, rol: "otra" })),
              ]);
            }}
          />
          <Boton pequeno variante="secundario" data-testid="btn-traer-medio" onClick={() => setPicker(true)}>
            <Images size={16} strokeWidth={1.9} /> Traer de la biblioteca
          </Boton>
        </div>
      )}

      <Dialogo
        abierto={!!visor}
        onCerrar={() => setVisor(null)}
        ancho="max-w-[1000px]"
        titulo={(porId[visor] || {}).nombre_original || "Referencia"}
        data-testid="visor-referencia"
      >
        {visor && (
          <>
            <img
              src={api.urlMedio(visor)}
              alt={(porId[visor] || {}).nombre_original || "Referencia"}
              className="max-h-[70vh] w-full object-contain"
              data-testid="visor-referencia-imagen"
            />
            <p className="mt-4 text-[13px] leading-[18px] text-tinta2">
              Imagen completa, sin recortar
              {porId[visor]?.ancho ? ` · ${porId[visor].ancho}×${porId[visor].alto}` : ""}.
            </p>
          </>
        )}
      </Dialogo>

      <Dialogo
        abierto={picker}
        onCerrar={() => setPicker(false)}
        titulo="Traer una imagen de la biblioteca"
        data-testid="dialogo-traer-medio"
      >
        {disponibles.length === 0 ? (
          <p className="text-[14px] leading-[20px] text-tinta2">
            No hay imágenes en la biblioteca de este espacio que no estén ya en la ficha.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {disponibles.map((m) => (
              <li key={m.id}>
                <button
                  data-testid={`elegir-medio-${m.id}`}
                  onClick={() => {
                    anadir(m.id);
                    setPicker(false);
                  }}
                  className="w-full overflow-hidden rounded-card border border-linea bg-superficie text-left transition-colors duration-[120ms] ease-suave hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  <div className="aspect-[4/3] w-full bg-superficie2">
                    <img
                      src={api.urlMedio(m.id)}
                      alt={m.nombre_original || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="block truncate p-2 text-[13px] leading-[18px] text-tinta2">
                    {m.nombre_original || m.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialogo>
    </div>
  );
}
