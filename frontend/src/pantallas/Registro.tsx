import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Selector from "../componentes/Selector";
import { Campo, Entrada } from "../componentes/Campo";
import TablaOperaciones from "../componentes/motor/TablaOperaciones";
import { api } from "../api/cliente";
import { formatoMoneda } from "../lib/formato";
import type { Operacion } from "../tipos";

const ESTADOS = [
  "",
  "presupuestada",
  "autorizada",
  "enviada",
  "en_curso",
  "completada",
  "incierta",
  "fallida",
];

/** Registro (P9, §9.5): todas las operaciones del estudio, filtrables, con
 * totales por proyecto y por espacio y exportación a CSV. */
export default function Registro() {
  const [espacioId, setEspacioId] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const { data: espacios } = useQuery({ queryKey: ["espacios"], queryFn: api.espacios });
  const { data: proyectos } = useQuery({
    queryKey: ["proyectos", espacioId],
    queryFn: () => api.proyectos(espacioId),
    enabled: !!espacioId,
  });

  const filtros: Record<string, string> = {};
  if (espacioId) filtros.espacio_id = espacioId;
  if (proyectoId) filtros.proyecto_id = proyectoId;
  if (estado) filtros.estado = estado;
  if (desde) filtros.desde = desde;
  if (hasta) filtros.hasta = hasta;

  const { data: operaciones, refetch } = useQuery({
    queryKey: ["registro-global", filtros],
    queryFn: () => api.operaciones(filtros),
    refetchInterval: 6000,
  });
  const { data: totales } = useQuery({
    queryKey: ["registro-global-totales", filtros],
    queryFn: () => api.totalesRegistro(filtros),
    refetchInterval: 6000,
  });
  const moneda = totales?.moneda || "USD";

  const accion = async (op: Operacion, que: "comprobar" | "reintentar" | "fallida") => {
    if (que === "comprobar") await api.comprobarOperacion(op.id);
    if (que === "reintentar") await api.reintentarOperacion(op.id);
    if (que === "fallida") await api.marcarFallida(op.id);
    await refetch();
  };

  return (
    <div>
      <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "Registro" }]} />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-10 md:px-10" data-testid="pantalla-registro">
        <h1 className="text-4xl leading-[44px] font-semibold text-tinta">Registro</h1>
        <p className="mt-3 max-w-[68ch] text-base leading-[24px] text-tinta2">
          Todo lo que ha pasado por el motor: qué se pidió, a qué modelo, a qué plano fue, qué se
          estimó y qué se cobró.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo etiqueta="Espacio">
            <Selector
              data-testid="filtro-espacio"
              valor={espacioId}
              opciones={[
                { valor: "", texto: "todos" },
                ...(espacios || []).map((e) => ({ valor: e.id, texto: e.nombre })),
              ]}
              onChange={(v) => {
                setEspacioId(v);
                setProyectoId("");
              }}
            />
          </Campo>
          <Campo etiqueta="Proyecto">
            <Selector
              data-testid="filtro-proyecto"
              valor={proyectoId}
              opciones={[
                { valor: "", texto: espacioId ? "todos" : "elige un espacio" },
                ...(proyectos || []).map((p) => ({ valor: p.id, texto: p.nombre })),
              ]}
              onChange={setProyectoId}
            />
          </Campo>
          <Campo etiqueta="Estado">
            <Selector
              data-testid="filtro-estado"
              valor={estado}
              opciones={ESTADOS.map((e) => ({ valor: e, texto: e || "todos" }))}
              onChange={setEstado}
            />
          </Campo>
          <Campo etiqueta="Desde" ayuda="día/mes/año">
            <Entrada
              data-testid="filtro-desde"
              type="date"
              lang="es-ES"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Hasta" ayuda="día/mes/año">
            <Entrada
              data-testid="filtro-hasta"
              type="date"
              lang="es-ES"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </Campo>
        </div>

        {totales && (
          <div
            data-testid="totales-registro"
            className="mt-8 rounded-card border border-linea bg-superficie2 p-4"
          >
            <p className="text-[18px] leading-[26px] font-semibold text-tinta">
              {formatoMoneda(totales.total, moneda)}{" "}
              <span className="text-[14px] font-normal text-tinta2">
                en {totales.operaciones} operaciones
              </span>
            </p>
            {totales.sin_verificar > 0 && (
              <p className="mt-1 text-[13px] leading-[18px] text-aviso">
                {totales.sin_verificar} con coste sin verificar.
              </p>
            )}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <h2 className="text-base leading-[24px] font-medium text-tinta">Por espacio</h2>
                <ul className="mt-1">
                  {totales.por_espacio.map((t) => (
                    <li key={t.espacio_id} className="text-[13px] leading-[20px] text-tinta2">
                      {t.nombre}: <span className="tabular">{formatoMoneda(t.total, moneda)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-base leading-[24px] font-medium text-tinta">Por proyecto</h2>
                <ul className="mt-1">
                  {totales.por_proyecto.map((t) => (
                    <li key={t.proyecto_id} className="text-[13px] leading-[20px] text-tinta2">
                      {t.nombre}: <span className="tabular">{formatoMoneda(t.total, moneda)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <a
              href={api.urlRegistroCsv(filtros)}
              data-testid="registro-csv"
              className="mt-4 inline-flex items-center gap-1 rounded-control px-3 py-1.5 text-[14px] leading-[20px] text-acento hover:bg-acentoSuave"
            >
              <Download size={15} strokeWidth={1.9} /> Exportar a CSV
            </a>
          </div>
        )}

        <div className="mt-8">
          <TablaOperaciones
            operaciones={operaciones || []}
            moneda={moneda}
            onComprobar={(op) => accion(op, "comprobar")}
            onReintentar={(op) => accion(op, "reintentar")}
            onMarcarFallida={(op) => accion(op, "fallida")}
          />
        </div>
      </main>
    </div>
  );
}
