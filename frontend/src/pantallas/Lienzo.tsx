import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cabecera from "../componentes/Cabecera";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SuperficieLienzo from "../componentes/lienzo/SuperficieLienzo";
import { api } from "../api/cliente";
import { useProyecto, usePiezas } from "../api/hooks";
import { rutaPaso as rutaDePaso } from "../lib/rutas";

// Lienzo (P7, §7). Ocupa todo el espacio bajo la cabecera y la barra del recorrido.
export default function Lienzo() {
  const { proyectoId, piezaId } = useParams();
  const navegar = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useProyecto(proyectoId);
  const { data: piezas } = usePiezas(proyectoId);

  const paso = data?.recorrido?.pasos?.find((p) => p.pantalla === "lienzo");
  const indice = data?.recorrido?.pasos?.findIndex((p) => p.pantalla === "lienzo") ?? -1;
  const bloqueo =
    data && indice > 0
      ? data.recorrido.pasos.slice(0, indice).filter((p) => p.obligatorio && !p.superado)
      : [];

  const aprobadas = (piezas || []).filter((p) => p.guion_estado === "aprobado");
  const pieza = piezaId
    ? aprobadas.find((p) => p.id === piezaId)
    : aprobadas[0];

  const { data: vista } = useQuery({
    queryKey: ["lienzo", pieza?.id],
    queryFn: () => api.lienzo(pieza!.id),
    enabled: !!pieza && bloqueo.length === 0,
  });
  const { data: opciones } = useQuery({
    queryKey: ["direccion-opciones"],
    queryFn: api.opcionesDireccion,
  });

  useEffect(() => {
    if (data?.proyecto && paso) {
      const ruta = pieza ? `/p/${proyectoId}/lienzo/${pieza.id}` : `/p/${proyectoId}/lienzo`;
      api.guardarUbicacion(proyectoId!, ruta).catch(() => {});
      document.title = `Lienzo · ${data.proyecto.nombre} · Picasso`;
    }
    return () => {
      document.title = "Estudio";
    };
    // eslint-disable-next-line
  }, [data?.proyecto?.id, pieza?.id]);

  if (isLoading || !data) {
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
    { texto: proyecto.nombre, a: `/p/${proyectoId}/guion` },
    { texto: "Lienzo" },
  ];
  const rutaGuion = pieza && proyecto.tipo === "serie"
    ? `/p/${proyectoId}/guion/${pieza.id}`
    : `/p/${proyectoId}/guion`;

  const rutaClase = (clase: string): string | null => {
    const p = recorrido.pasos.find((x) => x.pantalla === "elementos" && x.clase === clase);
    return p ? rutaDePaso(proyectoId!, p) : null;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={paso?.clave} />

      {bloqueo.length > 0 ? (
        <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10" data-testid="lienzo-bloqueado">
          <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">El lienzo todavía no se abre</h1>
          <p className="mt-4 text-[16px] leading-[24px] text-tinta2">
            Se abre con todos los pasos obligatorios listos y el guion (o el encargo) aprobado.
            Falta esto:
          </p>
          <ul className="mt-5 flex flex-col gap-2" data-testid="lista-falta">
            {bloqueo.map((p) => (
              <li key={p.clave}>
                <Link
                  to={rutaDePaso(proyectoId!, p)}
                  data-testid={`falta-${p.clave}`}
                  className="text-[16px] leading-[24px] text-acento underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  {p.nombre}
                </Link>
                <span className="ml-2 text-[14px] leading-[20px] text-tinta2">{p.listo_cuando}</span>
              </li>
            ))}
          </ul>
        </main>
      ) : !pieza ? (
        <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10" data-testid="lienzo-sin-pieza">
          <p className="text-[16px] leading-[24px] text-tinta2">
            Todavía no hay ningún guion aprobado. El lienzo se abre con la primera aprobación.
          </p>
          <Link
            to={rutaGuion}
            className="mt-4 inline-block text-[16px] leading-[24px] text-acento underline underline-offset-2"
          >
            Ir al guion
          </Link>
        </main>
      ) : !vista || !opciones ? (
        <p className="p-10 text-tinta2">Abriendo el lienzo…</p>
      ) : (
        <>
          {proyecto.tipo === "serie" && aprobadas.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-linea bg-superficie2 px-6 py-2">
              <span className="text-[13px] leading-[18px] text-tinta2">Capítulo:</span>
              {aprobadas.map((p) => (
                <button
                  key={p.id}
                  data-testid={`pieza-${p.id}`}
                  onClick={() => navegar(`/p/${proyectoId}/lienzo/${p.id}`)}
                  className={
                    "rounded-control px-3 py-1 text-[13px] leading-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                    (p.id === pieza.id ? "bg-acento text-white" : "text-tinta2 hover:bg-superficie")
                  }
                >
                  {p.titulo || `Capítulo ${p.numero || ""}`}
                </button>
              ))}
            </div>
          )}
          <SuperficieLienzo
            key={pieza.id}
            vista={vista}
            opciones={opciones}
            proyectoId={proyectoId!}
            rutaGuion={rutaGuion}
            rutaDePaso={rutaClase}
            onCambiado={async () => {
              await qc.invalidateQueries({ queryKey: ["lienzo", pieza.id] });
            }}
          />
        </>
      )}
    </div>
  );
}
