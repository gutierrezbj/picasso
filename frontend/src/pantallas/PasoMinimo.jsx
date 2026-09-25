import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Cabecera from "../componentes/Cabecera";
import BarraRecorrido from "../componentes/BarraRecorrido";
import SiguientePaso from "../componentes/SiguientePaso";
import EstadoPaso from "../componentes/EstadoPaso";
import { useProyecto } from "../api/hooks";
import { api } from "../api/cliente";

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

        <div className="mt-8 rounded-card border border-linea bg-superficie2 px-5 py-4">
          <p className="text-[14px] leading-[20px] text-tinta2" data-testid="aviso-fase">
            Este paso se construye en la Fase {paso.fase}.
          </p>
        </div>

        <SiguientePaso proyectoId={proyectoId} paso={paso} siguiente={siguiente} />
      </main>
    </div>
  );
}
