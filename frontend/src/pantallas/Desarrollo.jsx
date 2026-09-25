import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import PanelAsistente from "../componentes/PanelAsistente";
import Boton from "../componentes/Boton";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import { useProyecto, useDesarrollo, useFormato } from "../api/hooks";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";
import { ETIQUETA_CAMPO, AYUDA_CAMPO, CAMPOS_POR_TIPO, REQUERIDOS, ES_AREA } from "../lib/campos";

export default function Desarrollo() {
  const { proyectoId } = useParams();
  const qc = useQueryClient();
  const { data } = useProyecto(proyectoId);
  const { data: desInicial } = useDesarrollo(proyectoId);
  const tipo = data?.proyecto?.tipo;
  const { data: formatos } = useFormato(tipo);

  const [des, setDes] = useState(null);
  const cargado = useRef(false);

  useEffect(() => {
    if (desInicial && !cargado.current) {
      setDes({ respuestas_formato: {}, ...desInicial });
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
      await api.guardarDesarrollo(proyectoId, des);
      qc.setQueryData(["desarrollo", proyectoId], des);
    },
    { activo: !!des }
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
  const campos = CAMPOS_POR_TIPO[tipo] || [];
  const preguntas = (formatos && formatos[0]?.preguntas_desarrollo) || [];

  const requeridosOk = (REQUERIDOS[tipo] || []).every((c) => (des[c] || "").trim());
  const listo = des.estado === "listo";

  const set = (k, v) => setDes((d) => ({ ...d, [k]: v }));
  const setFormato = (clave, v) =>
    setDes((d) => ({ ...d, respuestas_formato: { ...(d.respuestas_formato || {}), [clave]: v } }));

  const marcarListo = async () => {
    const nuevo = { ...des, estado: "listo" };
    setDes(nuevo);
    await api.guardarDesarrollo(proyectoId, nuevo);
    qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
  };

  const recargarDesarrollo = async () => {
    const fresco = await api.desarrollo(proyectoId);
    cargado.current = false;
    setDes({ respuestas_formato: {}, ...fresco });
    qc.setQueryData(["desarrollo", proyectoId], fresco);
  };

  const migas = [
    { texto: "Estudio", a: "/" },
    { texto: espacio?.nombre || "Espacio", a: `/e/${proyecto.espacio_id}` },
    { texto: proyecto.nombre },
  ];

  return (
    <div className="min-h-full">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 py-10 md:px-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
              {paso.nombre}
            </h1>
            <EstadoPaso estado={paso.estado} className="text-[14px]" />
          </div>

          <div className="mt-8 flex max-w-[68ch] flex-col gap-6" data-testid="desarrollo-form">
            {campos.map((c) => {
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
            })}

            {preguntas.length > 0 && (
              <div className="mt-2 flex flex-col gap-6 border-t border-linea pt-6">
                <p className="text-[13px] font-medium text-tinta2">
                  Formato: {formatos[0].nombre}
                </p>
                {preguntas.map((q) => (
                  <Campo key={q.clave} etiqueta={q.pregunta} ayuda={q.ayuda} htmlFor={`fmt-${q.clave}`}>
                    <AreaTexto
                      id={`fmt-${q.clave}`}
                      data-testid={`fmt-${q.clave}`}
                      value={(des.respuestas_formato || {})[q.clave] || ""}
                      onChange={(e) => setFormato(q.clave, e.target.value)}
                    />
                  </Campo>
                ))}
              </div>
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
                Rellena los campos obligatorios (*) para poder marcarlo como listo.
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
