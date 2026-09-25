import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import Boton from "../componentes/Boton";
import Selector from "../componentes/Selector";
import SubidorMedios from "../componentes/SubidorMedios";
import { Campo } from "../componentes/Campo";
import { api } from "../api/cliente";
import { useBiblioteca } from "../api/hooks";

const FILTRO_CLASE_ELEMENTO = [
  { valor: "todas", texto: "Todas las clases" },
  { valor: "personaje", texto: "Personajes" },
  { valor: "producto", texto: "Productos" },
  { valor: "objeto", texto: "Objetos" },
  { valor: "escenario", texto: "Escenarios" },
];

const FILTRO_CLASE_MEDIO = [
  { valor: "todas", texto: "Todas las clases" },
  { valor: "imagen", texto: "Imágenes" },
  { valor: "video", texto: "Vídeos" },
  { valor: "audio", texto: "Audios" },
  { valor: "documento", texto: "Documentos" },
];

const ORDEN = [
  { valor: "nombre", texto: "Por nombre" },
  { valor: "reciente", texto: "Más recientes primero" },
];

function ordenar(lista, orden, campoNombre) {
  const copia = [...lista];
  if (orden === "nombre") {
    copia.sort((a, b) => String(a[campoNombre] || "").localeCompare(String(b[campoNombre] || "")));
  } else {
    copia.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }
  return copia;
}

export default function Biblioteca() {
  const { espacioId } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useBiblioteca(espacioId);
  const [pestana, setPestana] = useState("elementos");
  const [claseEl, setClaseEl] = useState("todas");
  const [claseMedio, setClaseMedio] = useState("todas");
  const [orden, setOrden] = useState("nombre");
  const [error, setError] = useState(null);

  const refrescar = () => qc.invalidateQueries({ queryKey: ["biblioteca", espacioId] });

  const borrar = async (fn) => {
    setError(null);
    try {
      await fn();
      refrescar();
      qc.invalidateQueries({ queryKey: ["medios", espacioId] });
      qc.invalidateQueries({ queryKey: ["elementos", espacioId] });
    } catch (e) {
      setError(e.message);
    }
  };

  const espacio = data?.espacio;
  const elementos = ordenar(
    (data?.elementos || []).filter((e) => claseEl === "todas" || e.clase === claseEl),
    orden,
    "nombre"
  );
  const medios = ordenar(
    (data?.medios || []).filter((m) => claseMedio === "todas" || m.clase === claseMedio),
    orden,
    "nombre_original"
  );

  return (
    <div className="min-h-full">
      <Cabecera
        migas={[
          { texto: "Estudio", a: "/" },
          { texto: espacio?.nombre || "…", a: `/e/${espacioId}` },
          { texto: "Biblioteca" },
        ]}
      />
      <main className="mx-auto w-full max-w-[1120px] px-6 py-10 md:px-10" data-testid="biblioteca">
        <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">Biblioteca del espacio</h1>
        <p className="mt-3 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">
          Todos los elementos y medios de este espacio. Nada de otros espacios aparece aquí.
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-2" role="tablist">
            {[
              { id: "elementos", texto: `Elementos (${data?.elementos?.length || 0})` },
              { id: "medios", texto: `Medios (${data?.medios?.length || 0})` },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={pestana === t.id}
                data-testid={`pestana-${t.id}`}
                onClick={() => setPestana(t.id)}
                className={
                  "min-h-[44px] rounded-control px-4 text-[14px] leading-[20px] transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                  (pestana === t.id
                    ? "bg-superficie font-semibold text-tinta ring-2 ring-acento"
                    : "border border-linea bg-superficie text-tinta2 hover:bg-superficie2")
                }
              >
                {t.texto}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[200px]">
              <Campo etiqueta="Clase">
                <Selector
                  data-testid="filtro-clase"
                  valor={pestana === "elementos" ? claseEl : claseMedio}
                  onChange={pestana === "elementos" ? setClaseEl : setClaseMedio}
                  opciones={pestana === "elementos" ? FILTRO_CLASE_ELEMENTO : FILTRO_CLASE_MEDIO}
                />
              </Campo>
            </div>
            <div className="w-[220px]">
              <Campo etiqueta="Orden">
                <Selector data-testid="filtro-orden" valor={orden} onChange={setOrden} opciones={ORDEN} />
              </Campo>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-6 text-[14px] leading-[20px] text-error" data-testid="error-biblioteca">
            {error}
          </p>
        )}

        {isLoading && <p className="mt-8 text-tinta2">Cargando…</p>}

        {pestana === "elementos" && !isLoading && (
          <div className="mt-8" data-testid="lista-elementos">
            {elementos.length === 0 ? (
              <Tarjeta className="p-10 text-center" data-testid="elementos-vacio">
                <p className="text-[16px] leading-[24px] text-tinta2">
                  Todavía no hay elementos en este espacio. Se crean en los pasos de elementos de un
                  proyecto.
                </p>
              </Tarjeta>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {elementos.map((el) => {
                  const primera = (el.ficha?.referencias || [])[0];
                  return (
                    <li
                      key={el.id}
                      className="flex items-start gap-4 rounded-card border border-linea bg-superficie p-4"
                      data-testid={`biblioteca-elemento-${el.id}`}
                    >
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-control bg-superficie2 text-[18px] font-semibold text-tinta2">
                        {primera ? (
                          <img
                            src={api.urlMedio(primera.medio_id)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          el.nombre.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[18px] leading-[24px] font-semibold text-tinta">
                          {el.nombre}
                        </div>
                        <div className="mt-1 text-[13px] leading-[18px] text-tinta2">
                          {el.clase} · v{el.ficha_vigente} ·{" "}
                          {el.ficha ? el.ficha.estado : "sin ficha"} · {el.num_versiones} versión
                          {el.num_versiones === 1 ? "" : "es"}
                        </div>
                        <div className="mt-1 text-[13px] leading-[18px] text-tinta2">
                          {el.proyectos.length
                            ? `En: ${el.proyectos.join(", ")}`
                            : "No está en ningún proyecto"}
                        </div>
                      </div>
                      <button
                        data-testid={`borrar-elemento-${el.id}`}
                        aria-label={`Borrar ${el.nombre}`}
                        onClick={() => borrar(() => api.borrarElemento(el.id))}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                      >
                        <Trash2 size={16} strokeWidth={1.9} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {pestana === "medios" && !isLoading && (
          <div className="mt-8" data-testid="lista-medios">
            <div className="mb-5">
              <SubidorMedios
                espacioId={espacioId}
                acepta="image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,text/csv"
                texto="Subir medios al espacio"
                testid="subir-medio-biblioteca"
                onSubido={refrescar}
              />
            </div>
            {medios.length === 0 ? (
              <Tarjeta className="p-10 text-center" data-testid="medios-vacio">
                <p className="text-[16px] leading-[24px] text-tinta2">
                  Todavía no hay medios en este espacio. Sube fotos, logos, audios o documentos.
                </p>
              </Tarjeta>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {medios.map((m) => (
                  <li
                    key={m.id}
                    className="overflow-hidden rounded-card border border-linea bg-superficie"
                    data-testid={`biblioteca-medio-${m.id}`}
                  >
                    <div className="aspect-[4/3] w-full bg-superficie2">
                      {m.clase === "imagen" ? (
                        <img
                          src={api.urlMedio(m.id)}
                          alt={m.nombre_original || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[14px] text-tinta2">
                          {m.clase}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-[14px] leading-[20px] text-tinta">
                        {m.nombre_original || m.id}
                      </div>
                      <div className="mt-1 text-[13px] leading-[18px] text-tinta2">
                        {m.clase}
                        {m.ancho && m.alto ? ` · ${m.ancho}×${m.alto}` : ""} · {m.origen}
                      </div>
                      <div className="mt-1 text-[13px] leading-[18px] text-tinta2">
                        {m.usado_en.length ? `Usado en: ${m.usado_en.join(", ")}` : "Sin usar"}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={api.urlMedio(m.id)}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={`abrir-medio-${m.id}`}
                          className="text-[13px] leading-[18px] text-acento underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                        >
                          Abrir
                        </a>
                        <Boton
                          pequeno
                          variante="secundario"
                          data-testid={`borrar-medio-${m.id}`}
                          onClick={() => borrar(() => api.borrarMedio(m.id))}
                        >
                          Borrar
                        </Boton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
