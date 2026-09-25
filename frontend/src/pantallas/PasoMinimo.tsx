import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Cabecera from "../componentes/Cabecera";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import { useProyecto } from "../api/hooks";
import { api } from "../api/cliente";
import { rutaPaso as rutaDePaso } from "../lib/rutas";

export default function PasoMinimo({ pantalla }) {
  const { proyectoId, clave } = useParams();
  const { data, isLoading } = useProyecto(proyectoId);

  const rutaActual =
    pantalla === "elementos"
      ? `/p/${proyectoId}/paso/${clave}`
      : `/p/${proyectoId}/${pantalla === "idea" ? "idea" : pantalla}`;

  // Retomar debe llevar aquí: guardamos la ubicación real al entrar.
  useEffect(() => {
    if (data?.proyecto) api.guardarUbicacion(proyectoId, rutaActual).catch(() => {});
    // eslint-disable-next-line
  }, [data?.proyecto?.id, rutaActual, proyectoId]);

  if (isLoading || !data) {
    return (
      <div>
        <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "…" }]} />
        <p className="p-10 text-tinta2">Cargando…</p>
      </div>
    );
  }

  const { proyecto, espacio, recorrido, gasto, moneda } = data;
  const pasos = recorrido.pasos;
  const paso =
    pantalla === "elementos"
      ? pasos.find((p) => p.clave === clave)
      : pasos.find((p) => p.pantalla === pantalla);

  const migas = [
    { texto: "Estudio", a: "/" },
    { texto: espacio?.nombre || "Espacio", a: `/e/${proyecto.espacio_id}` },
    { texto: proyecto.nombre },
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

  const indice = pasos.findIndex((p) => p.clave === paso.clave);
  const siguiente = pasos[indice + 1] || null;
  // §4.2: el lienzo solo se abre con los pasos obligatorios listos y el guion aprobado.
  const bloqueo = pasos
    .slice(0, indice)
    .filter((p) => p.obligatorio && p.estado !== "listo" && p.estado !== "no_hace_falta");

  return (
    <div className="min-h-full">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={paso.clave} />

      <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10" data-testid="paso-minimo">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[30px] leading-[38px] font-semibold text-tinta" data-testid="titulo-paso">
            {paso.nombre}
          </h1>
          <EstadoPaso estado={paso.estado} className="text-[14px]" />
        </div>

        <p className="mt-4 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">{paso.construye}</p>

        {pantalla === "lienzo" && bloqueo.length > 0 ? (
          <div
            className="mt-8 rounded-panel border border-linea bg-superficie px-6 py-5"
            data-testid="lienzo-bloqueado"
          >
            <h2 className="text-[16px] leading-[24px] font-semibold text-tinta">
              El lienzo todavía no se abre
            </h2>
            <p className="mt-2 text-[14px] leading-[20px] text-tinta2">
              Se abre con todos los pasos obligatorios listos y el guion (o el encargo) aprobado.
              Falta esto:
            </p>
            <ul className="mt-4 flex flex-col gap-2" data-testid="lista-falta">
              {bloqueo.map((p) => (
                <li key={p.clave}>
                  <Link
                    to={rutaDePaso(proyectoId, p)}
                    data-testid={`falta-${p.clave}`}
                    className="text-[16px] leading-[24px] text-acento underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                  >
                    {p.nombre}
                  </Link>
                  <span className="ml-2 text-[14px] leading-[20px] text-tinta2">{p.listo_cuando}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-8 rounded-card border border-linea bg-superficie2 px-5 py-4">
            <p className="text-[14px] leading-[20px] text-tinta2" data-testid="aviso-fase">
              Este paso se construye en la Fase {paso.fase}.
            </p>
          </div>
        )}

        <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
      </main>
    </div>
  );
}
