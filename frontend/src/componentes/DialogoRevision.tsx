import React, { useState } from "react";
import Dialogo from "./Dialogo";
import Boton from "./Boton";

const MARCAS = [
  { valor: "solo_texto", texto: "Solo texto" },
  { valor: "afecta_planos", texto: "Afecta a los planos" },
];

function Valor({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === "") return <span className="text-tinta3">— vacío —</span>;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-tinta3">— vacío —</span>;
    return <span>{v.map((x) => (typeof x === "object" ? `${x.hablante}: ${x.texto}` : x)).join(" · ")}</span>;
  }
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
}

// «Aprobar revisión» (§6.3): lista de escenas añadidas, editadas, eliminadas y
// reordenadas con sus diferencias. En cada escena editada el usuario marca
// «Solo texto» o «Afecta a los planos».
interface PropsDialogoRevision {
  abierto: boolean;
  onCerrar: () => void;
  diferencias?: any;
  esEncargo?: boolean;
  onAprobar: (marcas: Record<string, string>) => Promise<unknown>;
  onDescartar: () => Promise<unknown>;
}

export default function DialogoRevision({
  abierto,
  onCerrar,
  diferencias,
  esEncargo,
  onAprobar,
  onDescartar,
}: PropsDialogoRevision) {
  const [marcas, setMarcas] = useState<Record<string, string>>({});
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [pideConfirmacion, setPideConfirmacion] = useState(false);

  const d = diferencias || {};
  const editadas = d.editadas || [];
  const cambioEncargo = esEncargo && d.encargo?.hay_cambios;
  const faltan =
    editadas.some((e: any) => !marcas[e.escena_id]) || (cambioEncargo && !marcas.encargo);

  const aprobar = async () => {
    setError(null);
    setOcupado(true);
    try {
      await onAprobar(marcas);
      setMarcas({});
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const descartar = async () => {
    setError(null);
    setOcupado(true);
    try {
      await onDescartar();
      setMarcas({});
      setPideConfirmacion(false);
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const Marca = ({ id, segundaEtiqueta }: { id: string; segundaEtiqueta?: string }) => (
    <div className="mt-3 flex flex-wrap gap-2" data-testid={`marcas-${id}`}>
      {MARCAS.map((m0) => {
        const m =
          m0.valor === "afecta_planos" && segundaEtiqueta ? { ...m0, texto: segundaEtiqueta } : m0;
        return (
        <button
          key={m.valor}
          data-testid={`marca-${id}-${m.valor}`}
          onClick={() => setMarcas((x) => ({ ...x, [id]: m.valor }))}
          aria-pressed={marcas[id] === m.valor}
          className={
            "min-h-[40px] rounded-control px-4 text-[14px] leading-[20px] transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
            (marcas[id] === m.valor
              ? "bg-acento text-superficie"
              : "border border-linea bg-superficie text-tinta2 hover:bg-superficie2")
          }
        >
            {m.texto}
          </button>
        );
      })}
    </div>
  );

  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="max-w-[840px]"
      titulo="Aprobar revisión del guion"
      data-testid="dialogo-revision"
    >
      <div className="max-h-[62vh] overflow-y-auto pr-2">
        {!d.hay_cambios && !cambioEncargo && (
          <p className="text-[16px] leading-[24px] text-tinta2" data-testid="revision-sin-cambios">
            La revisión no tiene ningún cambio respecto al guion aprobado.
          </p>
        )}

        {cambioEncargo && (
          <section className="mb-8" data-testid="revision-encargo">
            <h3 className="text-[16px] leading-[24px] font-semibold text-tinta">Encargo de imagen</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {d.encargo.campos.map((c: any) => (
                <li key={c.campo} className="rounded-card border border-linea bg-superficie2 p-3">
                  <div className="text-[13px] leading-[18px] font-medium text-tinta2">{c.etiqueta}</div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-[14px] leading-[20px]">
                    <div>
                      <div className="mb-1 text-[12px] text-tinta3">Antes</div>
                      <div className="text-tinta2">
                        <Valor v={c.antes} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[12px] text-acento">Ahora</div>
                      <div className="text-tinta">
                        <Valor v={c.despues} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Marca id="encargo" segundaEtiqueta="Afecta a las imágenes" />
          </section>
        )}

        {(d.anadidas || []).length > 0 && (
          <section className="mb-8" data-testid="revision-anadidas">
            <h3 className="text-[16px] leading-[24px] font-semibold text-tinta">
              Escenas añadidas ({d.anadidas.length})
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {d.anadidas.map((e: any) => (
                <li key={e.escena_id} className="text-[14px] leading-[20px] text-tinta2">
                  {e.orden}. {e.titulo || "Escena sin título"}
                </li>
              ))}
            </ul>
          </section>
        )}

        {editadas.length > 0 && (
          <section className="mb-8" data-testid="revision-editadas">
            <h3 className="text-[16px] leading-[24px] font-semibold text-tinta">
              Escenas editadas ({editadas.length})
            </h3>
            <ul className="mt-3 flex flex-col gap-5">
              {editadas.map((e: any) => (
                <li
                  key={e.escena_id}
                  className="rounded-card border border-linea bg-superficie2 p-4"
                  data-testid={`revision-editada-${e.escena_id}`}
                >
                  <div className="text-[16px] leading-[24px] font-medium text-tinta">
                    {e.titulo || "Escena sin título"}
                  </div>
                  <ul className="mt-3 flex flex-col gap-3">
                    {e.campos.map((c: any) => (
                      <li key={c.campo}>
                        <div className="text-[13px] leading-[18px] font-medium text-tinta2">
                          {c.etiqueta}
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-3 text-[14px] leading-[20px]">
                          <div className="rounded-control bg-superficie p-2">
                            <div className="mb-1 text-[12px] text-tinta3">Antes</div>
                            <div className="text-tinta2">
                              <Valor v={c.antes} />
                            </div>
                          </div>
                          <div className="rounded-control bg-acentoSuave p-2">
                            <div className="mb-1 text-[12px] text-acento">Ahora</div>
                            <div className="text-tinta">
                              <Valor v={c.despues} />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Marca id={e.escena_id} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {(d.eliminadas || []).length > 0 && (
          <section className="mb-8" data-testid="revision-eliminadas">
            <h3 className="text-[16px] leading-[24px] font-semibold text-tinta">
              Escenas eliminadas ({d.eliminadas.length})
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {d.eliminadas.map((e: any) => (
                <li key={e.escena_id} className="text-[14px] leading-[20px] text-tinta2">
                  {e.orden}. {e.titulo || "Escena sin título"}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-[18px] text-tinta2">
              Sus planos pasarán a «sin escena» y se conservan hasta que los borres (§13).
            </p>
          </section>
        )}

        {(d.reordenadas || []).length > 0 && (
          <section className="mb-8" data-testid="revision-reordenadas">
            <h3 className="text-[16px] leading-[24px] font-semibold text-tinta">
              Escenas reordenadas ({d.reordenadas.length})
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {d.reordenadas.map((e: any) => (
                <li key={e.escena_id} className="text-[14px] leading-[20px] text-tinta2">
                  {e.titulo || "Escena sin título"}: de la posición {e.de} a la {e.a}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-[18px] text-tinta2">
              Reordenar solo cambia el montaje (§13).
            </p>
          </section>
        )}
      </div>

      {error && (
        <p className="mt-5 text-[14px] leading-[20px] text-error" data-testid="error-revision">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {pideConfirmacion ? (
          <div
            className="flex flex-wrap items-center gap-3 rounded-card border border-linea bg-superficie2 px-4 py-3"
            data-testid="confirmar-descartar-revision"
          >
            <span className="text-[14px] leading-[20px] text-tinta">
              Se pierde todo lo escrito en esta revisión. ¿Descartarla?
            </span>
            <Boton
              pequeno
              data-testid="btn-confirmar-descartar"
              disabled={ocupado}
              onClick={descartar}
            >
              Sí, descartar
            </Boton>
            <Boton
              pequeno
              variante="secundario"
              data-testid="btn-cancelar-descartar"
              onClick={() => setPideConfirmacion(false)}
            >
              Cancelar
            </Boton>
          </div>
        ) : (
          <Boton
            variante="texto"
            data-testid="btn-descartar-revision"
            disabled={ocupado}
            onClick={() => setPideConfirmacion(true)}
          >
            Descartar revisión
          </Boton>
        )}
        <div className="flex gap-3">
          <Boton variante="secundario" onClick={onCerrar}>
            Seguir editando
          </Boton>
          <Boton data-testid="btn-confirmar-revision" disabled={faltan || ocupado} onClick={aprobar}>
            Aprobar revisión
          </Boton>
        </div>
      </div>
      {faltan && (
        <p className="mt-3 text-right text-[13px] leading-[18px] text-tinta2" data-testid="aviso-marcas">
          {editadas.length > 0
            ? "Marca en cada escena editada si el cambio es solo de texto o si afecta a los planos."
            : "Marca si el cambio del encargo es solo de texto o si afecta a las imágenes."}
        </p>
      )}
    </Dialogo>
  );
}
