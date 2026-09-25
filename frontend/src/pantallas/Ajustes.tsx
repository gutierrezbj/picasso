import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import { Campo, Entrada } from "../componentes/Campo";
import Selector from "../componentes/Selector";
import { useAjustes, useAsistenteEstado } from "../api/hooks";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";

const MONEDA_FIJA = "USD";

export default function Ajustes() {
  const qc = useQueryClient();
  const { data, isLoading } = useAjustes();
  const { data: asis } = useAsistenteEstado();
  const [presupuesto, setPresupuesto] = useState("0");
  const [modelo, setModelo] = useState("claude-sonnet-5");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (data && !listo) {
      setPresupuesto(String(data.presupuesto_por_defecto ?? 0));
      setModelo(data.modelo_asistente || "claude-sonnet-5");
      setListo(true);
    }
  }, [data, listo]);

  useAutoguardado(
    { presupuesto, modelo },
    async () => {
      const guardado = await api.guardarAjustes({
        moneda: MONEDA_FIJA,
        presupuesto_por_defecto: Number(presupuesto) || 0,
        modelo_asistente: modelo,
      });
      qc.setQueryData(["ajustes"], guardado);
      qc.invalidateQueries({ queryKey: ["asistente-estado"] });
    },
    { activo: listo }
  );

  return (
    <div className="min-h-full">
      <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "Ajustes" }]} />
      <main className="mx-auto w-full max-w-[680px] px-6 py-12 md:px-10">
        <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">Ajustes</h1>
        {isLoading ? (
          <p className="mt-8 text-tinta2">Cargando…</p>
        ) : (
          <Tarjeta className="mt-8 flex flex-col gap-8 p-8" data-testid="ajustes-form">
            <Campo
              etiqueta="Moneda"
              ayuda="La misma en que cobran los proveedores. Sin conversión a otras monedas en esta versión."
            >
              <span className="text-[16px] leading-[24px] text-tinta" data-testid="dato-moneda">
                USD
              </span>
            </Campo>
            <Campo etiqueta="Presupuesto por defecto" ayuda="Tope de gasto sugerido al crear un proyecto.">
              <Entrada
                data-testid="input-presupuesto"
                type="number"
                min="0"
                step="0.01"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Modelo del asistente" ayuda="«simulado» no gasta créditos; Claude usa la clave configurada.">
              <Selector
                data-testid="select-modelo-asistente"
                valor={modelo}
                onChange={setModelo}
                opciones={[
                  { valor: "simulado", texto: "Simulado (sin coste)" },
                  { valor: "claude-sonnet-5", texto: "Claude Sonnet 5" },
                ]}
              />
              <span className="text-[13px] text-tinta2" data-testid="asistente-estado">
                {asis?.disponible ? `Disponible · ${asis.modelo}` : `No disponible — ${asis?.motivo || ""}`}
              </span>
            </Campo>
            <p className="text-[13px] leading-[18px] text-tinta2">
              Los proveedores de producción y sus claves se configuran en fases posteriores.
            </p>
          </Tarjeta>
        )}
      </main>
    </div>
  );
}
