import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import { resumenProyecto } from "../lib/formato";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import PanelAsistente from "../componentes/PanelAsistente";
import Boton from "../componentes/Boton";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import { useProyecto, useDesarrollo, useFormato } from "../api/hooks";
import { api } from "../api/cliente";
import type { CamposDinamicos } from "../tipos";
import { useAutoguardado } from "../estado/useAutoguardado";
import { useGuardado } from "../estado/GuardadoContext";
import { ETIQUETA_CAMPO, AYUDA_CAMPO, REQUERIDOS, ES_AREA, IDEA_ORDENADA, PROVOCAR } from "../lib/campos";
import { DESTINOS, FORMATOS } from "../lib/destinos";
import Selector from "../componentes/Selector";

export default function Desarrollo() {
  const { proyectoId } = useParams();
  const qc = useQueryClient();
  const { data } = useProyecto(proyectoId);
  const { data: desInicial } = useDesarrollo(proyectoId);
  const tipo = data?.proyecto?.tipo;
  const { data: formatos } = useFormato(tipo);

  const [des, setDes] = useState<CamposDinamicos | null>(null);
  const cargado = useRef(false);
  const sello = useRef<string | null>(null); // updated_at guardado (§12)
  const g = useGuardado();
  const [errorEncargo, setErrorEncargo] = useState<string | null>(null);

  useEffect(() => {
    if (desInicial && !cargado.current) {
      const { updated_at, ...resto } = desInicial as any;
      sello.current = updated_at ?? null;
      setDes({ respuestas_formato: {}, ...resto });
      cargado.current = true;
    }
  }, [desInicial]);

  useEffect(() => {
    if (data?.proyecto) {
      api.guardarUbicacion(proyectoId, `/p/${proyectoId}/idea`).catch(() => {});
      const pasoIdea = data.recorrido.pasos.find((p) => p.pantalla === "idea");
      document.title = `${pasoIdea?.nombre || "Idea"} · ${data.proyecto.nombre} · Picasso`;
    }
    return () => {
      document.title = "Estudio";
    };
    // eslint-disable-next-line
  }, [data?.proyecto?.id, proyectoId]);

  useAutoguardado(
    des,
    async () => {
      const guardado = await api.guardarDesarrollo(proyectoId, {
        ...des,
        updated_at: sello.current,
      });
      sello.current = guardado.updated_at ?? null;
      qc.setQueryData(["desarrollo", proyectoId], guardado);
    },
    {
      activo: !!des,
      // Conflicto de versión (§12): recargar lo guardado o sobrescribirlo con lo
      // que hay en pantalla. Nunca se pierde lo escrito sin decirlo.
      recargar: async () => {
        await recargarDesarrollo();
        g.guardado();
      },
      sobrescribir: async () => {
        const fresco = await api.desarrollo(proyectoId);
        const guardado = await api.guardarDesarrollo(proyectoId, {
          ...des,
          updated_at: (fresco as any).updated_at ?? null,
        });
        sello.current = guardado.updated_at ?? null;
        qc.setQueryData(["desarrollo", proyectoId], guardado);
        g.guardado();
      },
    }
  );

  if (!data || !des) {
    return (
      <div>
        <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "…" }]} />
        <p className="p-10 text-tinta2">Cargando…</p>
      </div>
    );
  }

  const { proyecto, espacio, recorrido, gasto, moneda } = data;
  const paso = recorrido.pasos.find((p) => p.pantalla === "idea");
  const siguiente = recorrido.pasos[recorrido.pasos.indexOf(paso) + 1] || null;
  const preguntas = (formatos && formatos[0]?.preguntas_desarrollo) || [];
  const preguntasEncargo = preguntas.filter((q: any) => q.clave === "episodios");
  const preguntasProvocar = preguntas.filter((q: any) => q.clave !== "episodios");
  const conDuracion = tipo === "corto" || tipo === "anuncio";

  const requeridosOk = (REQUERIDOS[tipo] || []).every((c: any) => (des[c] || "").trim());
  const listo = des.estado === "listo";

  const set = (k: string, v: any) => setDes((d: any) => ({ ...d, [k]: v }));

  const editarProyecto = async (cambios: Record<string, unknown>) => {
    setErrorEncargo(null);
    try {
      await api.editarProyecto(proyecto.id, { ...cambios, updated_at: proyecto.updated_at });
      await qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
    } catch (e) {
      setErrorEncargo(e instanceof Error ? e.message : "No se ha podido guardar.");
    }
  };

  const elegirDestino = async (valor: string) => {
    set("destino", valor);
    const propuesto = DESTINOS.find((x) => x.valor === valor)?.formato;
    if (propuesto && propuesto !== proyecto.formato_video) await editarProyecto({ formato_video: propuesto });
  };

  const campo = (c: string) => {
    const req = (REQUERIDOS[tipo] || []).includes(c);
    const etiqueta = ETIQUETA_CAMPO[c] + (req ? " *" : "");
    return (
      <Campo key={c} etiqueta={etiqueta} ayuda={AYUDA_CAMPO[c]} htmlFor={`campo-${c}`}>
        {ES_AREA.has(c) ? (
          <AreaTexto id={`campo-${c}`} data-testid={`campo-${c}`} value={des[c] || ""} onChange={(e) => set(c, e.target.value)} />
        ) : (
          <Entrada id={`campo-${c}`} data-testid={`campo-${c}`} value={des[c] || ""} onChange={(e) => set(c, e.target.value)} />
        )}
      </Campo>
    );
  };

  const pregunta = (q: any) => (
    <Campo key={q.clave} etiqueta={q.pregunta} ayuda={q.ayuda} htmlFor={`fmt-${q.clave}`}>
      <AreaTexto
        id={`fmt-${q.clave}`}
        data-testid={`fmt-${q.clave}`}
        value={(des.respuestas_formato || {})[q.clave] || ""}
        onChange={(e) => setFormato(q.clave, e.target.value)}
      />
    </Campo>
  );

  const bloque = (titulo: string, texto: string, hijos: React.ReactNode, testid: string) => (
    <section className="flex flex-col gap-6 border-t border-linea pt-6 first:border-t-0 first:pt-0" data-testid={testid}>
      <div>
        <h2 className="text-[20px] leading-[28px] font-semibold text-tinta">{titulo}</h2>
        <p className="mt-1 text-[14px] leading-[20px] text-tinta2">{texto}</p>
      </div>
      {hijos}
    </section>
  );
  const setFormato = (clave: string, v: any) =>
    setDes((d: any) => ({ ...d, respuestas_formato: { ...(d.respuestas_formato || {}), [clave]: v } }));

  const marcarListo = async () => {
    const nuevo = { ...des, estado: "listo" };
    setDes(nuevo);
    const guardado = await api.guardarDesarrollo(proyectoId, {
      ...nuevo,
      updated_at: sello.current,
    });
    sello.current = guardado.updated_at ?? null;
    qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
  };

  const recargarDesarrollo = async () => {
    const fresco = await api.desarrollo(proyectoId);
    const { updated_at, ...resto } = fresco as any;
    sello.current = updated_at ?? null;
    setDes({ respuestas_formato: {}, ...resto });
    qc.setQueryData(["desarrollo", proyectoId], fresco);
  };

  const migas = [
    { texto: "Estudio", a: "/" },
    { texto: espacio?.nombre || "Espacio", a: `/e/${proyecto.espacio_id}` },
    { texto: proyecto.nombre, insignia: resumenProyecto(proyecto) },
  ];

  return (
    <div className="min-h-full">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido
        proyectoId={proyectoId}
        recorrido={recorrido}
        claveVista={(recorrido.pasos.find((p) => p.pantalla === "idea") || {}).clave}
      />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 py-10 md:px-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
              {paso.nombre}
            </h1>
            <EstadoPaso estado={paso.estado} className="text-[14px]" />
          </div>

          <div className="mt-8 flex max-w-[68ch] flex-col gap-10" data-testid="desarrollo-form">
            {bloque(
              "El encargo",
              "Dónde va a vivir y para quién. Decide el formato antes de imaginar nada.",
              <>
                <Campo etiqueta="¿Dónde se va a publicar? *" htmlFor="destino">
                  <Selector
                    data-testid="campo-destino"
                    valor={des.destino || ""}
                    onChange={(v: string) => elegirDestino(v)}
                    opciones={[{ valor: "", texto: "Elige el destino" }, ...DESTINOS.map((x) => ({ valor: x.valor, texto: x.texto }))]}
                  />
                </Campo>
                {campo("destino_detalle")}
                <Campo
                  etiqueta="Formato"
                  htmlFor="formato"
                  ayuda={
                    DESTINOS.find((x) => x.valor === des.destino)?.formato === proyecto.formato_video
                      ? "Propuesto por el destino. Puedes cambiarlo mientras no haya tomas producidas."
                      : "Puedes cambiarlo mientras no haya tomas producidas."
                  }
                >
                  <Selector
                    data-testid="campo-formato"
                    valor={proyecto.formato_video}
                    onChange={(v: string) => editarProyecto({ formato_video: v })}
                    opciones={FORMATOS}
                  />
                </Campo>
                {campo("publico")}
                {conDuracion && (
                  <Campo etiqueta="Duración (segundos)" ayuda="Orientativa." htmlFor="duracion">
                    <Entrada
                      id="duracion"
                      data-testid="campo-duracion"
                      type="number"
                      min={1}
                      defaultValue={proyecto.duracion_objetivo_s ?? ""}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n) && n !== proyecto.duracion_objetivo_s) editarProyecto({ duracion_objetivo_s: n });
                      }}
                    />
                  </Campo>
                )}
                {preguntasEncargo.map(pregunta)}
                {errorEncargo && <p className="text-[14px] text-error">{errorEncargo}</p>}
              </>,
              "bloque-encargo"
            )}
            {bloque(
              "Tu idea",
              "Lo que tienes en la cabeza. Escríbelo sin ordenar; el asistente te ayuda a repartirlo.",
              <>
                {campo("notas")}
                {(IDEA_ORDENADA[tipo] || []).map(campo)}
              </>,
              "bloque-idea"
            )}
            {bloque(
              "Lo que debe provocar",
              "Qué tiene que sentir o entender quien lo vea, y qué no quieres.",
              <>
                {PROVOCAR.map(campo)}
                {preguntasProvocar.map(pregunta)}
              </>,
              "bloque-provocar"
            )}
          </div>

          <div className="mt-8">
            {listo ? (
              <div className="flex items-center gap-2 text-[14px] text-exito" data-testid="desarrollo-listo">
                <CheckCircle2 size={18} strokeWidth={1.9} /> Desarrollo marcado como listo. Puedes seguir editándolo.
              </div>
            ) : (
              <Boton data-testid="btn-marcar-listo" disabled={!requeridosOk} onClick={marcarListo}>
                Marcar desarrollo como listo
              </Boton>
            )}
            {!listo && !requeridosOk && (
              <p className="mt-2 text-[13px] text-tinta2">
                Para marcarlo como listo faltan los campos con *: el destino, tu idea y la intención (y los propios del tipo).
              </p>
            )}
          </div>

          <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
        </div>

        <PanelAsistente
          proyectoId={proyectoId}
          tipo={tipo}
          desActual={des}
          preguntasFormato={preguntas}
          onAplicado={recargarDesarrollo}
        />
      </main>
    </div>
  );
}
