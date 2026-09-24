import React from "react";
import { useParams } from "react-router-dom";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import { useEspacio } from "../api/hooks";

export default function BibliotecaMinima() {
  const { espacioId } = useParams();
  const { data: espacio } = useEspacio(espacioId);

  return (
    <div className="min-h-full">
      <Cabecera
        migas={[
          { texto: "Estudio", a: "/" },
          { texto: espacio?.nombre || "…", a: `/e/${espacioId}` },
          { texto: "Biblioteca" },
        ]}
      />
      <main className="mx-auto w-full max-w-[880px] px-6 py-12 md:px-10">
        <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">Biblioteca del espacio</h1>
        <Tarjeta className="mt-8 p-8" data-testid="biblioteca-minima">
          <p className="text-[16px] leading-[24px] text-tinta2">Este apartado se construye en la Fase 3.</p>
        </Tarjeta>
      </main>
    </div>
  );
}
