import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, PackageCheck } from "lucide-react";
import Boton from "./Boton";
import { Campo, Entrada } from "./Campo";
import { api } from "../api/cliente";
import type { Exportacion } from "../tipos";

// «Exportar paquete de edición» (§11.3): trabajo en segundo plano con progreso,
// sin coste. El ZIP sale ordenado por carpetas, listo para DaVinci o CapCut.

const mb = (b?: number) => (b ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : "");

export default function PanelExportar({ piezaId, onExportado }: { piezaId: string; onExportado?: () => void }) {
  const [alternativas, setAlternativas] = useState(false);
  const [rutas, setRutas] = useState<"relativas" | "absolutas">("relativas");
  const [carpeta, setCarpeta] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: lista, refetch } = useQuery({
    queryKey: ["exportaciones", piezaId],
    queryFn: () => api.exportaciones(piezaId),
    refetchInterval: (q) => ((q.state.data || []).some((e: Exportacion) => e.estado === "en_curso") ? 1000 : false),
    // Que siga el progreso aunque la pestaña esté en segundo plano.
    refetchIntervalInBackground: true,
  });
  const actual = (lista || [])[0];
  const enCurso = actual?.estado === "en_curso";

  const exportar = async () => {
    setError(null);
    try {
      await api.exportar(piezaId, {
        alternativas,
        rutas,
        ...(rutas === "absolutas" ? { carpeta_destino: carpeta.trim() } : {}),
      });
      await refetch();
      onExportado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido exportar.");
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-card bg-superficie p-6" data-testid="panel-exportar">
      <div className="flex items-start gap-3">
        <PackageCheck size={22} strokeWidth={1.9} className="mt-1 text-acento" aria-hidden />
        <div>
          <h2 className="text-[22px] leading-[30px] font-semibold text-tinta">Paquete de edición</h2>
          <p className="mt-1 max-w-[68ch] text-[14px] leading-[20px] text-tinta2">
            Un ZIP ordenado por carpetas: vídeo, imagen, voces, música, ambiente, fichas, la línea de tiempo
            para DaVinci, un previo, el guion y un LEEME con cómo importarlo. Todo a los fps del proyecto.
            No tiene coste.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 text-[16px] text-tinta">
        <input
          type="checkbox"
          data-testid="exportar-alternativas"
          checked={alternativas}
          onChange={(e) => setAlternativas(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-acento)]"
        />
        Incluir las tomas no elegidas y los originales sin normalizar (carpeta alternativas/)
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[14px] font-medium text-tinta">Rutas de la línea de tiempo</legend>
        <label className="flex items-center gap-3 text-[16px] text-tinta">
          <input type="radio" name="rutas" checked={rutas === "relativas"} onChange={() => setRutas("relativas")} className="h-5 w-5 accent-[var(--color-acento)]" />
          Relativas a la carpeta del paquete
        </label>
        <label className="flex items-center gap-3 text-[16px] text-tinta">
          <input type="radio" name="rutas" data-testid="exportar-absolutas" checked={rutas === "absolutas"} onChange={() => setRutas("absolutas")} className="h-5 w-5 accent-[var(--color-acento)]" />
          Absolutas: por si el editor no encuentra los clips con las relativas
        </label>
        {rutas === "absolutas" && (
          <div className="max-w-[560px]">
            <Campo etiqueta="Carpeta donde vas a descomprimir el ZIP" ayuda="Por ejemplo /Users/juan/Movies/Picasso">
              <Entrada data-testid="exportar-carpeta" value={carpeta} onChange={(e) => setCarpeta(e.target.value)} placeholder="/Users/juan/Movies/Picasso" />
            </Campo>
          </div>
        )}
      </fieldset>

      <div>
        <Boton data-testid="exportar-paquete" onClick={exportar} disabled={enCurso || (rutas === "absolutas" && !carpeta.trim())}>
          Exportar paquete de edición
        </Boton>
      </div>
      {error && <p className="text-error">{error}</p>}

      {actual && (
        <div className="flex flex-col gap-2 rounded-control bg-superficie2 p-4" data-testid="exportacion-actual">
          {actual.estado === "en_curso" && (
            <>
              <p className="text-[14px] text-tinta">{actual.paso}…</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-superficie">
                <div className="h-full bg-acento transition-all" style={{ width: `${actual.progreso}%` }} />
              </div>
            </>
          )}
          {actual.estado === "lista" && (
            <a
              href={api.urlExportacion(actual.id)}
              data-testid="descargar-paquete"
              className="flex items-center gap-2 text-[16px] font-medium text-acento underline"
            >
              <Download size={18} strokeWidth={1.9} aria-hidden /> Descargar {actual.nombre_archivo} ({mb(actual.tamano_bytes)})
            </a>
          )}
          {actual.estado === "fallida" && (
            <p className="flex items-start gap-2 text-[14px] text-error" data-testid="exportacion-error">
              <AlertTriangle size={16} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
              {actual.error}
            </p>
          )}
          {actual.estado === "lista" && actual.avisos.length > 0 && (
            <p className="text-[13px] text-tinta2">
              Exportado con {actual.avisos.length} aviso(s); van listados en el LEEME del paquete.
            </p>
          )}
        </div>
      )}

      {(lista || []).length > 1 && (
        <details className="text-[14px] text-tinta2">
          <summary className="cursor-pointer">Exportaciones anteriores</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {(lista || []).slice(1).map((e) => (
              <li key={e.id}>
                {new Date(e.created_at).toLocaleString("es-ES")} ·{" "}
                {e.estado === "lista" ? (
                  <a href={api.urlExportacion(e.id)} className="text-acento underline">
                    {e.nombre_archivo}
                  </a>
                ) : (
                  e.estado
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
