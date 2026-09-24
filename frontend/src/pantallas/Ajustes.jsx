import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import { Campo, Entrada } from "../componentes/Campo";
import Selector from "../componentes/Selector";
import { useAjustes } from "../api/hooks";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";

const MONEDAS = [
  { valor: "USD", texto: "Dólar (USD $)" },
  { valor: "EUR", texto: "Euro (EUR €)" },
  { valor: "GBP", texto: "Libra (GBP £)" },
];

export default function Ajustes() {
  const qc = useQueryClient();
  const { data, isLoading } = useAjustes();
  const [moneda, setMoneda] = useState("USD");
  const [presupuesto, setPresupuesto] = useState("0");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (data && !listo) {
      setMoneda(data.moneda);
      setPresupuesto(String(data.presupuesto_por_defecto ?? 0));
      setListo(true);
    }
  }, [data, listo]);

  useAutoguardado(
    { moneda, presupuesto },
    async () => {
      const guardado = await api.guardarAjustes({
        moneda,
        presupuesto_por_defecto: Number(presupuesto) || 0,
      });
      qc.setQueryData(["ajustes"], guardado);
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
            <Campo etiqueta="Moneda" ayuda="Se usa para mostrar costes y presupuesto.">
              <Selector data-testid="select-moneda" valor={moneda} onChange={setMoneda} opciones={MONEDAS} />
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
            <p className="text-[13px] leading-[18px] text-tinta2">
              Los proveedores, sus claves y el modelo del asistente se configuran en fases
              posteriores.
            </p>
          </Tarjeta>
        )}
      </main>
    </div>
  );
}
