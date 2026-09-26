import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Images, Trash2, MinusCircle, RotateCcw } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import { resumenProyecto } from "../lib/formato";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import PanelAsistente from "../componentes/PanelAsistente";
import FichaElemento from "../componentes/FichaElemento";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import Selector from "../componentes/Selector";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import { api } from "../api/cliente";
import { useProyecto, useReparto, useElementos, useMedios, useDesarrollo, useFormato } from "../api/hooks";
import { useAutoguardado } from "../estado/useAutoguardado";
import { ETIQUETA_CAMPO, AYUDA_CAMPO } from "../lib/campos";

const CLASES = [
  { valor: "personaje", texto: "Personaje" },
  { valor: "producto", texto: "Producto" },
  { valor: "objeto", texto: "Objeto" },
  { valor: "escenario", texto: "Escenario" },
];

const NOMBRE_CLASE: Record<string, any> = {
  personaje: "personaje",
  producto: "producto",
  objeto: "objeto",
  escenario: "escenario",
};

function CampoDesarrollo({ proyectoId, clave }: { proyectoId: string; clave: string }) {
  const qc = useQueryClient();
  const { data: inicial } = useDesarrollo(proyectoId);
  const [valor, setValor] = useState(null);

  useEffect(() => {
    if (inicial && valor === null) setValor((inicial as Record<string, any>)[clave] || "");
    // eslint-disable-next-line
  }, [inicial]);

  useAutoguardado(
    valor,
    async () => {
      const actual = await api.desarrollo(proyectoId);
      const nuevo = { ...actual, [clave]: valor };
      await api.guardarDesarrollo(proyectoId, nuevo);
      qc.setQueryData(["desarrollo", proyectoId], nuevo);
    },
    { activo: valor !== null }
  );

  if (valor === null) return null;
  return (
    <div className="mt-8 max-w-[68ch]">
      <Campo etiqueta={ETIQUETA_CAMPO[clave]} ayuda={AYUDA_CAMPO[clave]} htmlFor={`paso-campo-${clave}`}>
        <AreaTexto
          id={`paso-campo-${clave}`}
          data-testid={`campo-${clave}`}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </Campo>
    </div>
  );
}

export default function PasoElementos() {
  const { proyectoId, clave } = useParams();
  const qc = useQueryClient();
  const { data } = useProyecto(proyectoId);
  const espacioId = data?.proyecto?.espacio_id;

  const paso = data?.recorrido?.pasos?.find((p) => p.clave === clave);
  const clase = paso?.clase || null;

  const { data: reparto } = useReparto(proyectoId, clase);
  const { data: elementosEspacio } = useElementos(espacioId, clase);
  const { data: medios } = useMedios(espacioId, "imagen");
  const { data: formatos } = useFormato(data?.proyecto?.tipo);

  const [sel, setSel] = useState(null);
  const [versionSel, setVersionSel] = useState(null);
  const [dCrear, setDCrear] = useState(false);
  const [dTraer, setDTraer] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [claseNueva, setClaseNueva] = useState("personaje");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (data?.proyecto && paso) {
      api.guardarUbicacion(proyectoId, `/p/${proyectoId}/paso/${clave}`).catch(() => {});
      document.title = `${paso.nombre} · ${data.proyecto.nombre} · Picasso`;
    }
    return () => {
      document.title = "Estudio";
    };
    // eslint-disable-next-line
  }, [data?.proyecto?.id, clave]);

  const entradas = reparto || [];
  const entrada = useMemo(
    () => entradas.find((e) => e.elemento_id === sel) || entradas[0] || null,
    [entradas, sel]
  );

  const refrescar = async ({ recargarLista = true } = {}) => {
    if (recargarLista) {
      await qc.invalidateQueries({ queryKey: ["reparto", proyectoId] });
      await qc.invalidateQueries({ queryKey: ["elementos", espacioId] });
      await qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
      await qc.invalidateQueries({ queryKey: ["biblioteca", espacioId] });
    }
  };

  const conError = async (fn: any) => {
    setError(null);
    try {
      await fn();
      await refrescar();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data) {
    return (
      <div>
        <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "…" }]} />
        <p className="p-10 text-tinta2">Cargando…</p>
      </div>
    );
  }

  const { proyecto, espacio, recorrido, gasto, moneda } = data;
  const migas = [
    { texto: "Estudio", a: "/" },
    { texto: espacio?.nombre || "Espacio", a: `/e/${proyecto.espacio_id}` },
    { texto: proyecto.nombre, insignia: resumenProyecto(proyecto) },
  ];

  if (!paso) {
    return (
      <div className="min-h-full">
        <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
        <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={clave} />
        <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10">
          <p className="text-tinta2">Este paso no forma parte del recorrido de este proyecto.</p>
        </main>
      </div>
    );
  }

  const indice = recorrido.pasos.findIndex((p) => p.clave === paso.clave);
  const siguiente = recorrido.pasos[indice + 1] || null;
  const omitido = (proyecto.pasos_omitidos || []).includes(paso.clave);
  const preguntas = (formatos && formatos[0]?.preguntas_desarrollo) || [];

  const enReparto = new Set(entradas.map((e) => e.elemento_id));
  const disponibles = (elementosEspacio || []).filter((e) => !enReparto.has(e.id));

  const crear = async () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    await conError(async () => {
      const el = await api.crearElemento(espacioId, { clase: clase || claseNueva, nombre });
      await api.anadirAlReparto(proyectoId, { elemento_id: el.id });
      setSel(el.id);
      setVersionSel(null);
      setNombreNuevo("");
      setDCrear(false);
    });
  };

  const traer = async (elementoId: string) => {
    await conError(async () => {
      await api.anadirAlReparto(proyectoId, { elemento_id: elementoId });
      setSel(elementoId);
      setVersionSel(null);
      setDTraer(false);
    });
  };

  const quitar = async (entradaId: string) =>
    conError(async () => {
      await api.quitarDelReparto(proyectoId, entradaId);
      setSel(null);
      setVersionSel(null);
    });

  const cambiarOmitido = async (valor: any) =>
    conError(async () => {
      const lista = new Set(proyecto.pasos_omitidos || []);
      if (valor) lista.add(paso.clave);
      else lista.delete(paso.clave);
      await api.editarProyecto(proyectoId, {
        pasos_omitidos: Array.from(lista),
        updated_at: proyecto.updated_at,
      });
    });

  const fichaMostrada = entrada
    ? entrada.fichas.find((f) => f.version === (versionSel || entrada.version_ficha)) ||
      entrada.fichas[entrada.fichas.length - 1]
    : null;

  return (
    <div className="min-h-full">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={clave} />

      <main className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-10" data-testid="paso-elementos">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
            {paso.nombre}
          </h1>
          <EstadoPaso estado={paso.estado} className="text-[14px]" />
        </div>
        <p className="mt-4 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">{paso.construye}</p>

        {paso.campo_desarrollo && (
          <CampoDesarrollo proyectoId={proyectoId} clave={paso.campo_desarrollo} />
        )}

        {error && (
          <p className="mt-6 text-[14px] leading-[20px] text-error" data-testid="error-paso">
            {error}
          </p>
        )}

        <div className="mt-10 flex flex-col gap-8 xl:flex-row">
          <div className="w-full xl:w-[280px] xl:shrink-0">
            <div className="flex flex-col gap-2">
              <Boton pequeno data-testid="btn-crear-elemento" onClick={() => setDCrear(true)}>
                <Plus size={16} strokeWidth={1.9} /> Crear nuevo
              </Boton>
              <Boton
                pequeno
                variante="secundario"
                data-testid="btn-traer-biblioteca"
                onClick={() => setDTraer(true)}
              >
                <Images size={16} strokeWidth={1.9} /> Traer de la biblioteca
              </Boton>
            </div>

            {entradas.length === 0 ? (
              <p className="mt-5 text-[14px] leading-[20px] text-tinta2" data-testid="reparto-vacio">
                Todavía no hay nada en este paso.
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3" data-testid="lista-reparto">
                {entradas.map((e) => {
                  const activo = entrada && e.id === entrada.id;
                  const ficha = e.ficha;
                  const primera = (ficha?.referencias || [])[0];
                  return (
                    <li key={e.id} className="flex items-stretch gap-2">
                      <button
                        data-testid={`elemento-${e.elemento_id}`}
                        onClick={() => {
                          setSel(e.elemento_id);
                          setVersionSel(null);
                        }}
                        className={
                          "flex min-w-0 flex-1 items-center gap-3 rounded-card p-2 text-left transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                          (activo
                            ? "bg-superficie ring-2 ring-acento"
                            : "border border-linea bg-superficie hover:bg-superficie2")
                        }
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-superficie2 text-[14px] font-semibold text-tinta2">
                          {primera ? (
                            <img
                              src={api.urlMedio(primera.medio_id)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            e.elemento.nombre.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[16px] leading-[24px] font-medium text-tinta">
                            {e.elemento.nombre}
                          </span>
                          <span className="block text-[13px] leading-[18px] text-tinta2">
                            v{e.version_ficha} · {ficha ? ficha.estado : "sin ficha"}
                            {e.hay_version_nueva ? ` · hay v${e.hay_version_nueva}` : ""}
                          </span>
                        </span>
                      </button>
                      <button
                        data-testid={`quitar-elemento-${e.elemento_id}`}
                        aria-label={`Quitar ${e.elemento.nombre} del proyecto`}
                        onClick={() => quitar(e.id)}
                        className="flex w-10 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                      >
                        <Trash2 size={16} strokeWidth={1.9} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {entrada && fichaMostrada ? (
              <FichaElemento
                key={`${entrada.elemento_id}-${fichaMostrada.id}`}
                elemento={entrada.elemento}
                ficha={fichaMostrada}
                proyectoId={proyectoId}
                versiones={entrada.fichas}
                versionFijada={entrada.version_ficha}
                ultimaAprobada={entrada.ultima_aprobada}
                medios={medios || []}
                espacioId={espacioId}
                onElegirVersion={setVersionSel}
                onVersionCreada={setVersionSel}
                onCambiada={refrescar}
                onMediosNuevos={() => qc.invalidateQueries({ queryKey: ["medios", espacioId] })}
                onActualizarFijada={(v) =>
                  api.editarReparto(proyectoId, entrada.id, { version_ficha: v })
                }
              />
            ) : (
              <div
                className="rounded-panel border border-linea bg-superficie p-8"
                data-testid="ficha-vacia"
              >
                <p className="text-[16px] leading-[24px] text-tinta2">
                  Elige o crea un {NOMBRE_CLASE[clase] || "elemento"} para definir su ficha.
                </p>
              </div>
            )}
          </div>

          <PanelAsistente
            proyectoId={proyectoId}
            tipo={proyecto.tipo}
            modo="elementos"
            clase={clase || claseNueva}
            preguntasFormato={preguntas}
            onAplicado={refrescar}
          />
        </div>

        {!paso.obligatorio && (
          <div
            className="mt-12 flex flex-wrap items-center gap-3 rounded-panel border border-linea bg-superficie px-5 py-4"
            data-testid="bloque-opcional"
          >
            {omitido ? (
              <>
                <span className="text-[14px] leading-[20px] text-tinta2">
                  Este paso está marcado como «No hace falta en este proyecto».
                </span>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="btn-recuperar-paso"
                  onClick={() => cambiarOmitido(false)}
                >
                  <RotateCcw size={16} strokeWidth={1.9} /> Recuperar este paso
                </Boton>
              </>
            ) : (
              <>
                <span className="text-[14px] leading-[20px] text-tinta2">
                  Este paso es opcional.
                </span>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="btn-no-hace-falta"
                  onClick={() => cambiarOmitido(true)}
                >
                  <MinusCircle size={16} strokeWidth={1.9} /> No hace falta en este proyecto
                </Boton>
              </>
            )}
          </div>
        )}

        <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
      </main>

      <Dialogo
        abierto={dCrear}
        onCerrar={() => setDCrear(false)}
        titulo={`Crear ${NOMBRE_CLASE[clase] || "elemento"}`}
        data-testid="dialogo-crear-elemento"
      >
        <div className="flex flex-col gap-6">
          {!clase && (
            <Campo etiqueta="Clase">
              <Selector
                data-testid="select-clase-nueva"
                valor={claseNueva}
                onChange={setClaseNueva}
                opciones={CLASES}
              />
            </Campo>
          )}
          <Campo etiqueta="Nombre" htmlFor="nombre-elemento-nuevo">
            <Entrada
              id="nombre-elemento-nuevo"
              data-testid="input-nombre-elemento-nuevo"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
              autoFocus
            />
          </Campo>
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setDCrear(false)}>
              Cancelar
            </Boton>
            <Boton data-testid="btn-confirmar-crear" disabled={!nombreNuevo.trim()} onClick={crear}>
              Crear
            </Boton>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={dTraer}
        onCerrar={() => setDTraer(false)}
        titulo="Traer de la biblioteca"
        data-testid="dialogo-traer-elemento"
      >
        {disponibles.length === 0 ? (
          <p className="text-[14px] leading-[20px] text-tinta2" data-testid="biblioteca-sin-elementos">
            No hay elementos de este tipo en la biblioteca de este espacio que no estén ya en el
            proyecto.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {disponibles.map((el) => (
              <li key={el.id}>
                <button
                  data-testid={`traer-${el.id}`}
                  onClick={() => traer(el.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-card border border-linea bg-superficie p-4 text-left transition-colors duration-[120ms] ease-suave hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] leading-[24px] font-medium text-tinta">
                      {el.nombre}
                    </span>
                    <span className="block text-[13px] leading-[18px] text-tinta2">
                      {el.clase} · v{el.ficha_vigente} ·{" "}
                      {el.ficha ? el.ficha.estado : "sin ficha"}
                    </span>
                  </span>
                  <span className="text-[13px] leading-[18px] text-acento">Traer</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-[13px] leading-[18px] text-tinta2">
          Traer fija la versión vigente de la ficha. Solo se ven elementos de este espacio.
        </p>
      </Dialogo>
    </div>
  );
}
