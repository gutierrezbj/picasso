import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, Check, Pencil, Trash2 } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import { resumenProyecto } from "../lib/formato";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import PanelAsistente from "../componentes/PanelAsistente";
import TarjetaEscena from "../componentes/TarjetaEscena";
import LeerGuion from "../componentes/LeerGuion";
import DialogoRevision from "../componentes/DialogoRevision";
import PanelElementoNuevo from "../componentes/PanelElementoNuevo";
import DialogoConfirmar from "../componentes/DialogoConfirmar";
import type { CamposDinamicos, Encargo, EntradaReparto, Medio, Paso, Pieza, Proyecto } from "../tipos";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import Tarjeta from "../componentes/Tarjeta";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import { api } from "../api/cliente";
import { useProyecto, usePiezas, useGuion, useReparto, useMedios, useFormato } from "../api/hooks";
import { useAutoguardado } from "../estado/useAutoguardado";

function ListaCapitulos({ proyecto, piezas, paso, onCrear, onBorrar }: {
  proyecto: Proyecto;
  piezas: Pieza[];
  paso?: Paso;
  onCrear: (datos: CamposDinamicos) => void | Promise<unknown>;
  onBorrar: (id: string) => void | Promise<unknown>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [deQueVa, setDeQueVa] = useState("");

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Boton data-testid="btn-nuevo-capitulo" onClick={() => setAbierto(true)}>
          <Plus size={16} strokeWidth={1.9} /> Nuevo capítulo
        </Boton>
      </div>
      {piezas.length === 0 ? (
        <Tarjeta className="mt-8 p-10 text-center" data-testid="capitulos-vacio">
          <p className="text-[16px] leading-[24px] text-tinta2">
            Todavía no hay capítulos. Cada capítulo tiene su propio guion.
          </p>
        </Tarjeta>
      ) : (
        <ul className="mt-8 flex flex-col gap-4" data-testid="lista-capitulos">
          {piezas.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-linea bg-superficie p-5"
              data-testid={`capitulo-${p.id}`}
            >
              <div className="min-w-0">
                <Link
                  to={`/p/${proyecto.id}/guion/${p.id}`}
                  data-testid={`abrir-capitulo-${p.id}`}
                  className="text-[18px] leading-[24px] font-semibold text-tinta underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  {p.numero ? `${p.numero}. ` : ""}
                  {p.titulo || "Capítulo sin título"}
                </Link>
                {p.de_que_va && (
                  <p className="mt-2 max-w-[68ch] text-[14px] leading-[20px] text-tinta2">{p.de_que_va}</p>
                )}
                <p className="mt-2 text-[13px] leading-[18px] text-tinta2">
                  Guion {p.guion_estado === "aprobado" ? `aprobado · revisión ${p.guion_revision}` : "en borrador"}
                  {p.revision_en_curso ? " · revisión en curso" : ""} · {p.num_escenas} escena
                  {p.num_escenas === 1 ? "" : "s"}
                </p>
              </div>
              <button
                data-testid={`borrar-capitulo-${p.id}`}
                aria-label={`Borrar ${p.titulo || "capítulo"}`}
                onClick={() => onBorrar(p.id)}
                className="flex h-10 w-10 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
              >
                <Trash2 size={16} strokeWidth={1.9} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-[14px] leading-[20px] text-tinta2">{paso.listo_cuando}</p>

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Nuevo capítulo"
        data-testid="dialogo-nuevo-capitulo"
      >
        <div className="flex flex-col gap-6">
          <Campo etiqueta="Título" htmlFor="capitulo-titulo">
            <Entrada
              id="capitulo-titulo"
              data-testid="input-titulo-capitulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </Campo>
          <Campo etiqueta="De qué va" ayuda="Una o dos frases.">
            <AreaTexto
              data-testid="input-dequeva-capitulo"
              value={deQueVa}
              onChange={(e) => setDeQueVa(e.target.value)}
            />
          </Campo>
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
            <Boton
              data-testid="btn-crear-capitulo"
              disabled={!titulo.trim()}
              onClick={async () => {
                await onCrear({ titulo: titulo.trim(), de_que_va: deQueVa.trim() || null });
                setTitulo("");
                setDeQueVa("");
                setAbierto(false);
              }}
            >
              Crear capítulo
            </Boton>
          </div>
        </div>
      </Dialogo>
    </>
  );
}

function FormularioEncargo({ piezaId, encargo, editable, reparto, medios, onGuardado, onCrearElemento }: {
  piezaId: string;
  encargo: Encargo;
  editable: boolean;
  reparto: EntradaReparto[];
  medios: Medio[];
  onGuardado: () => void | Promise<unknown>;
  onCrearElemento: () => void;
}) {
  const [datos, setDatos] = useState<CamposDinamicos>({
    que_se_muestra: encargo?.que_se_muestra || "",
    composicion: encargo?.composicion || "",
    intencion: encargo?.intencion || "",
    elementos: encargo?.elementos || [],
    referencias: encargo?.referencias || [],
    numero_imagenes: encargo?.numero_imagenes || 1,
  });

  useAutoguardado(
    datos,
    async () => {
      await api.guardarEncargo(piezaId, { ...datos, numero_imagenes: Number(datos.numero_imagenes) || 1 });
      onGuardado?.();
    },
    { activo: editable }
  );

  const set = (k: string, v: any) => setDatos((d) => ({ ...d, [k]: v }));
  const imagenes = (medios || []).filter((m) => m.clase === "imagen");

  return (
    <section className="mt-8 max-w-[76ch] rounded-panel border border-linea bg-superficie p-6" data-testid="encargo-imagen">
      <div className="flex flex-col gap-6">
        {[
          ["que_se_muestra", "Qué se muestra", "Lo que tiene que aparecer en la imagen."],
          ["composicion", "Composición", "Encuadre, punto de vista, luz."],
          ["intencion", "Intención", "Para qué se usará la imagen."],
        ].map(([clave, etiqueta, ayuda]) => (
          <Campo key={clave} etiqueta={etiqueta} ayuda={ayuda}>
            {editable ? (
              <AreaTexto
                data-testid={`encargo-${clave}`}
                value={datos[clave]}
                onChange={(e) => set(clave, e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                {datos[clave] || "— vacío —"}
              </p>
            )}
          </Campo>
        ))}

        <Campo etiqueta="Elementos" ayuda="Solo los del reparto de este proyecto.">
          <div className="flex flex-wrap items-center gap-2" data-testid="encargo-elementos">
            {reparto.length === 0 && (
              <span className="text-[14px] leading-[20px] text-tinta3">
                El reparto está vacío.
              </span>
            )}
            {reparto.map((r) => {
              const puesto = datos.elementos.includes(r.id);
              if (!editable && !puesto) return null;
              return (
                <button
                  key={r.id}
                  data-testid={`encargo-chip-${r.elemento_id}`}
                  disabled={!editable}
                  aria-pressed={puesto}
                  onClick={() =>
                    set(
                      "elementos",
                      puesto ? datos.elementos.filter((x: any) => x !== r.id) : [...datos.elementos, r.id]
                    )
                  }
                  className={
                    "min-h-[36px] rounded-full px-3 text-[13px] leading-[18px] transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                    (puesto
                      ? "bg-acento text-superficie"
                      : "border border-linea bg-superficie text-tinta2 hover:bg-superficie2")
                  }
                >
                  {r.elemento.nombre}
                  <span className="ml-2 opacity-70">{r.elemento.clase}</span>
                </button>
              );
            })}
            {editable && onCrearElemento && (
              <Boton pequeno variante="secundario" data-testid="encargo-crear-elemento" onClick={onCrearElemento}>
                <Plus size={15} strokeWidth={1.9} /> Falta un elemento
              </Boton>
            )}
          </div>
        </Campo>

        <Campo etiqueta="Referencias" ayuda="Imágenes de la biblioteca del espacio.">
          {imagenes.length === 0 ? (
            <p className="text-[14px] leading-[20px] text-tinta3">
              No hay imágenes en la biblioteca de este espacio.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5" data-testid="encargo-referencias">
              {imagenes.map((m) => {
                const puesta = datos.referencias.includes(m.id);
                if (!editable && !puesta) return null;
                return (
                  <li key={m.id}>
                    <button
                      data-testid={`encargo-ref-${m.id}`}
                      disabled={!editable}
                      aria-pressed={puesta}
                      onClick={() =>
                        set(
                          "referencias",
                          puesta
                            ? datos.referencias.filter((x: any) => x !== m.id)
                            : [...datos.referencias, m.id]
                        )
                      }
                      className={
                        "block w-full overflow-hidden rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                        (puesta ? "ring-2 ring-acento" : "border border-linea")
                      }
                    >
                      <span className="block aspect-[4/3] w-full bg-superficie2">
                        <img
                          src={api.urlMedio(m.id)}
                          alt={m.nombre_original || ""}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Campo>

        <div className="max-w-[200px]">
          <Campo etiqueta="Número de imágenes" htmlFor="encargo-numero">
            {editable ? (
              <Entrada
                id="encargo-numero"
                type="number"
                min="1"
                data-testid="encargo-numero"
                value={datos.numero_imagenes}
                onChange={(e) => set("numero_imagenes", e.target.value)}
              />
            ) : (
              <p className="text-[16px] leading-[24px] text-tinta">{datos.numero_imagenes}</p>
            )}
          </Campo>
        </div>
      </div>
    </section>
  );
}

export default function Guion() {
  const { proyectoId, piezaId } = useParams();
  const navegar = useNavigate();
  const qc = useQueryClient();
  const { data } = useProyecto(proyectoId);
  const { data: piezas } = usePiezas(proyectoId);
  const espacioId = data?.proyecto?.espacio_id;

  const esSerie = data?.proyecto?.tipo === "serie";
  const pieza = useMemo(() => {
    if (!piezas || piezas.length === 0) return null;
    if (piezaId) return piezas.find((p) => p.id === piezaId) || null;
    return esSerie ? null : piezas[0];
  }, [piezas, piezaId, esSerie]);

  const { data: guionData } = useGuion(pieza?.id);
  const { data: reparto } = useReparto(proyectoId);
  const { data: medios } = useMedios(espacioId, "imagen");
  const { data: formatos } = useFormato(data?.proyecto?.tipo);

  const [leer, setLeer] = useState(false);
  const [revision, setRevision] = useState(false);
  const [nuevoElemento, setNuevoElemento] = useState(false);
  const [error, setError] = useState(null);
  const [peticion, setPeticion] = useState(null);
  // Confirmaciones de acciones que pierden trabajo: "descartar" o borrar una escena.
  const [confirmar, setConfirmar] = useState<"descartar" | { tipo: "borrar-escena"; id: string } | null>(
    null
  );

  const paso = data?.recorrido?.pasos?.find((p) => p.pantalla === "guion");

  useEffect(() => {
    if (data?.proyecto && paso) {
      const ruta = piezaId ? `/p/${proyectoId}/guion/${piezaId}` : `/p/${proyectoId}/guion`;
      api.guardarUbicacion(proyectoId, ruta).catch(() => {});
      document.title = `${paso.nombre} · ${data.proyecto.nombre} · Picasso`;
    }
    return () => {
      document.title = "Estudio";
    };
    // eslint-disable-next-line
  }, [data?.proyecto?.id, piezaId]);

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["guion", pieza?.id] });
    await qc.invalidateQueries({ queryKey: ["piezas", proyectoId] });
    await qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
    await qc.invalidateQueries({ queryKey: ["reparto", proyectoId] });
  };

  const accion = async (fn: any) => {
    setError(null);
    try {
      await fn();
      await refrescar();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data || !piezas) {
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
    { texto: proyecto.nombre, a: `/p/${proyectoId}/guion`, insignia: resumenProyecto(proyecto) },
    ...(pieza && esSerie ? [{ texto: pieza.titulo || `Capítulo ${pieza.numero || ""}` }] : []),
  ];

  const indice = recorrido.pasos.findIndex((p) => p.clave === paso?.clave);
  const siguiente = recorrido.pasos[indice + 1] || null;
  const entradas = reparto || [];
  const preguntas = (formatos && formatos[0]?.preguntas_desarrollo) || [];

  const guion = guionData?.guion;
  const escenas = guionData?.escenas || [];
  const hayRevision = guionData?.hay_revision_en_curso;
  const aprobado = guion?.estado === "aprobado";
  const editable = !aprobado || hayRevision;
  const falta = guionData?.falta_para_aprobar || [];
  const esEncargo = guion?.clase === "encargo";
  const escenaAConfirmar =
    confirmar && typeof confirmar === "object"
      ? escenas.find((e) => e.id === confirmar.id) || null
      : null;

  const cabecera = (
    <>
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={paso?.clave} />
    </>
  );

  if (!paso) {
    return (
      <div className="min-h-full">
        {cabecera}
        <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10">
          <p className="text-tinta2">Este paso no forma parte del recorrido de este proyecto.</p>
        </main>
      </div>
    );
  }

  // Serie sin capítulo elegido: lista de capítulos (§4.1)
  if (esSerie && !pieza) {
    return (
      <div className="min-h-full">
        {cabecera}
        <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10" data-testid="pantalla-capitulos">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
              {paso.nombre}
            </h1>
            <EstadoPaso estado={paso.estado} className="text-[14px]" />
          </div>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">{paso.construye}</p>
          {error && (
            <p className="mt-6 text-[14px] leading-[20px] text-error" data-testid="error-guion">
              {error}
            </p>
          )}
          <ListaCapitulos
            proyecto={proyecto}
            piezas={piezas}
            paso={paso}
            onCrear={(datos) => accion(() => api.crearPieza(proyectoId, datos))}
            onBorrar={(id) => accion(() => api.borrarPieza(id))}
          />
          <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {cabecera}
      <main className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-10" data-testid="pantalla-guion">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
            {esSerie && pieza ? pieza.titulo || `Capítulo ${pieza.numero || ""}` : paso.nombre}
          </h1>
          <EstadoPaso estado={paso.estado} className="text-[14px]" />
          {guion && (
            <span className="font-mono text-[13px] leading-[18px] text-tinta2" data-testid="estado-guion">
              {aprobado ? `Aprobado · revisión ${guion.revision}` : "Borrador"}
              {hayRevision ? " · revisión en curso" : ""}
            </span>
          )}
        </div>
        <p className="mt-4 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">{paso.construye}</p>
        {esSerie && (
          <Link
            to={`/p/${proyectoId}/guion`}
            data-testid="volver-capitulos"
            className="mt-4 inline-block text-[14px] leading-[20px] text-acento underline underline-offset-2"
          >
            Ver todos los capítulos
          </Link>
        )}

        {aprobado && !hayRevision && (
          <div
            className="mt-8 flex flex-wrap items-center gap-3 rounded-panel border border-linea bg-superficie px-5 py-4"
            data-testid="aviso-aprobado"
          >
            <span className="flex items-center gap-2 text-[14px] leading-[20px] text-exito">
              <Check size={18} strokeWidth={1.9} /> Guion aprobado (revisión {guion.revision}).
            </span>
            <span className="text-[13px] leading-[18px] text-tinta2">
              Editarlo no lo desaprueba: abre una revisión en curso y el guion aprobado sigue vigente.
            </span>
            <Boton
              pequeno
              variante="secundario"
              data-testid="btn-editar-aprobado"
              onClick={() => accion(() => api.crearRevision(pieza.id))}
            >
              <Pencil size={15} strokeWidth={1.9} /> Editar el guion (crea una revisión)
            </Boton>
          </div>
        )}

        {hayRevision && (
          <div
            className="mt-8 flex flex-wrap items-center gap-3 rounded-panel border border-linea bg-acentoSuave px-5 py-4"
            data-testid="aviso-revision"
          >
            <span className="text-[14px] leading-[20px] text-acentoTinta">
              Revisión en curso sobre la revisión {guion.revision}. El guion aprobado sigue vigente.
            </span>
            <Boton pequeno data-testid="btn-abrir-revision" onClick={() => setRevision(true)}>
              Aprobar revisión
            </Boton>
            <Boton
              pequeno
              variante="texto"
              data-testid="btn-descartar-revision-directo"
              onClick={() => setConfirmar("descartar")}
            >
              Descartar revisión
            </Boton>
          </div>
        )}

        {error && (
          <p className="mt-6 text-[14px] leading-[20px] text-error" data-testid="error-guion">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-8 xl:flex-row">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {!esEncargo && editable && (
                <Boton data-testid="btn-anadir-escena" onClick={() => accion(() => api.crearEscena(pieza.id, {}))}>
                  <Plus size={16} strokeWidth={1.9} /> Añadir escena
                </Boton>
              )}
              {!esEncargo && (
                <Boton variante="secundario" data-testid="btn-leer-guion" onClick={() => setLeer(true)}>
                  <BookOpen size={16} strokeWidth={1.9} /> Leer guion completo
                </Boton>
              )}
            </div>

            {esEncargo ? (
              <FormularioEncargo
                key={`${pieza.id}-${hayRevision ? "rev" : guion?.revision}`}
                piezaId={pieza.id}
                encargo={guionData?.encargo}
                editable={editable}
                reparto={entradas}
                medios={medios}
                onGuardado={refrescar}
                onCrearElemento={() => setNuevoElemento(true)}
              />
            ) : escenas.length === 0 ? (
              <Tarjeta className="mt-8 p-10 text-center" data-testid="escenas-vacio">
                <p className="text-[16px] leading-[24px] text-tinta2">
                  Todavía no hay escenas. Añade la primera y escribe qué ocurre.
                </p>
              </Tarjeta>
            ) : (
              <ul className="mt-8 flex flex-col gap-6" data-testid="lista-escenas">
                {escenas.map((e, i) => (
                  <TarjetaEscena
                    key={e.id}
                    escena={e}
                    indice={i}
                    total={escenas.length}
                    reparto={entradas}
                    editable={editable}
                    onMover={(id, direccion) => accion(() => api.moverEscena(id, { direccion }))}
                    arrastre={(desde, hasta) =>
                      accion(() => api.moverEscena(escenas[desde].id, { a: hasta }))
                    }
                    onBorrar={(id) => setConfirmar({ tipo: "borrar-escena", id })}
                    onCambiada={refrescar}
                    onCrearElemento={() => setNuevoElemento(true)}
                    onReescribir={(escena, campo) =>
                      setPeticion({ tarea: "reescribir_escena", escena_id: escena.id, campo })
                    }
                  />
                ))}
              </ul>
            )}

            <div
              className="mt-10 flex flex-wrap items-center gap-3 rounded-panel border border-linea bg-superficie px-5 py-4"
              data-testid="bloque-aprobar"
            >
              {hayRevision ? (
                <Boton
                  data-testid="btn-aprobar-guion"
                  disabled={falta.length > 0}
                  onClick={() => setRevision(true)}
                >
                  Aprobar revisión
                </Boton>
              ) : (
                <Boton
                  data-testid="btn-aprobar-guion"
                  disabled={aprobado || falta.length > 0}
                  onClick={() => accion(() => api.aprobarGuion(pieza.id))}
                >
                  {aprobado ? "Guion aprobado" : esEncargo ? "Aprobar encargo" : "Aprobar guion"}
                </Boton>
              )}
              <span className="text-[13px] leading-[18px] text-tinta2" data-testid="aviso-aprobar-guion">
                {aprobado && !hayRevision
                  ? "El lienzo está abierto y trabaja con esta revisión."
                  : falta.length > 0
                  ? `Para aprobar, ${falta.join(" y ")}.`
                  : "La primera aprobación abre el lienzo."}
              </span>
            </div>

            <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
          </div>

          <PanelAsistente
            proyectoId={proyectoId}
            tipo={proyecto.tipo}
            modo="guion"
            piezaId={pieza?.id}
            escenas={escenas}
            preguntasFormato={preguntas}
            peticionPendiente={peticion}
            onPeticionConsumida={() => setPeticion(null)}
            onAplicado={refrescar}
          />
        </div>
      </main>

      <LeerGuion
        abierto={leer}
        onCerrar={() => setLeer(false)}
        pieza={pieza}
        escenas={escenas}
        reparto={entradas}
      />

      <DialogoRevision
        abierto={revision}
        onCerrar={() => setRevision(false)}
        diferencias={guionData?.diferencias}
        esEncargo={esEncargo}
        onAprobar={async (marcas) => {
          await api.aprobarRevision(pieza.id, marcas);
          await refrescar();
        }}
        onDescartar={async () => {
          await api.descartarRevision(pieza.id);
          await refrescar();
        }}
      />

      <PanelElementoNuevo
        abierto={nuevoElemento}
        onCerrar={() => setNuevoElemento(false)}
        espacioId={espacioId}
        proyectoId={proyectoId}
        onCreado={refrescar}
      />

      <DialogoConfirmar
        abierto={confirmar === "descartar"}
        testid="confirmar-descartar-revision"
        titulo="¿Descartar la revisión en curso?"
        mensaje={
          <>
            Se pierde todo lo escrito en esta revisión (escenas añadidas, editadas o
            eliminadas). El guion aprobado, la revisión {guion?.revision}, queda intacto.
          </>
        }
        etiquetaConfirmar="Descartar revisión"
        onConfirmar={() => {
          setConfirmar(null);
          accion(() => api.descartarRevision(pieza.id));
        }}
        onCerrar={() => setConfirmar(null)}
      />

      <DialogoConfirmar
        abierto={!!confirmar && typeof confirmar === "object" && confirmar.tipo === "borrar-escena"}
        testid="confirmar-borrar-escena"
        titulo="¿Borrar esta escena?"
        mensaje={
          <>
            Se borra «{escenaAConfirmar?.titulo || "sin título"}» con todo lo que contiene:
            qué ocurre, qué se ve, intención, elementos y diálogos. Las demás escenas se
            renumeran. No se puede deshacer.
          </>
        }
        etiquetaConfirmar="Borrar escena"
        onConfirmar={() => {
          const id = typeof confirmar === "object" && confirmar ? confirmar.id : null;
          setConfirmar(null);
          if (id) accion(() => api.borrarEscena(id));
        }}
        onCerrar={() => setConfirmar(null)}
      />
    </div>
  );
}
