import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import Boton from "./Boton";
import { AreaTexto } from "./Campo";
import Selector from "./Selector";
import { api } from "../api/cliente";
import { useAsistenteEstado } from "../api/hooks";
import { ETIQUETA_CAMPO, CAMPOS_POR_TIPO } from "../lib/campos";

// Panel del asistente (§10). Propone; nada se escribe sin que el usuario acepte.
export default function PanelAsistente({ proyectoId, tipo, onAplicado }) {
  const { data: estado } = useAsistenteEstado();
  const [propuesta, setPropuesta] = useState(null); // {id, tarea, partes:[{...,edit}]}
  const [campo, setCampo] = useState(CAMPOS_POR_TIPO[tipo]?.[0] || "intencion");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const disponible = estado?.disponible;

  const pedir = async (tarea, extra) => {
    setCargando(true);
    setError(null);
    try {
      const p = await api.proponer(proyectoId, tarea, extra);
      setPropuesta({ ...p, partes: p.partes.map((x) => ({ ...x, edit: x.texto })) });
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const resolver = async (parte, accion) => {
    await api.resolverParte(propuesta.id, parte.id, { accion, texto: parte.edit });
    setPropuesta((prev) => ({ ...prev, partes: prev.partes.filter((x) => x.id !== parte.id) }));
    if (accion === "aceptar") onAplicado?.();
  };

  return (
    <aside
      data-testid="panel-asistente"
      className="w-full rounded-panel border border-linea bg-superficie2 p-5 lg:w-[380px] lg:shrink-0"
    >
      <div className="flex items-center gap-2 text-[16px] font-semibold text-tinta">
        <Sparkles size={18} strokeWidth={1.9} className="text-acento" /> Asistente
      </div>

      {!disponible ? (
        <p className="mt-3 text-[13px] leading-[18px] text-tinta2" data-testid="asistente-desactivado">
          Asistente no disponible. {estado?.motivo}
        </p>
      ) : (
        <>
          <p className="mt-2 text-[13px] leading-[18px] text-tinta2">
            Propone; tú decides. Nada se escribe sin que lo aceptes ({estado?.modelo}).
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Boton pequeno variante="secundario" data-testid="btn-hacer-preguntas" disabled={cargando} onClick={() => pedir("hacer_preguntas")}>
              Hacer preguntas
            </Boton>
            <Boton pequeno variante="secundario" data-testid="btn-ordenar-notas" disabled={cargando} onClick={() => pedir("ordenar_notas")}>
              Ordenar mis notas
            </Boton>
            <div className="flex gap-2">
              <Selector
                data-testid="select-campo-proponer"
                valor={campo}
                onChange={setCampo}
                opciones={(CAMPOS_POR_TIPO[tipo] || []).map((c) => ({ valor: c, texto: ETIQUETA_CAMPO[c] }))}
              />
              <Boton pequeno data-testid="btn-proponer-campo" disabled={cargando} onClick={() => pedir("proponer_campo", { campo })}>
                Proponer
              </Boton>
            </div>
          </div>

          {cargando && <p className="mt-4 text-[13px] text-tinta2">Pensando…</p>}
          {error && <p className="mt-4 text-[13px] text-error">{error}</p>}

          {propuesta && propuesta.partes.length > 0 && (
            <div className="mt-5 flex flex-col gap-4" data-testid="propuestas">
              {propuesta.partes.map((parte) => (
                <div key={parte.id} className="rounded-card border border-linea bg-superficie p-3" data-testid="propuesta-parte">
                  <div className="mb-2 text-[13px] font-medium text-tinta2">
                    {ETIQUETA_CAMPO[parte.destino_campo] || parte.destino_campo}
                    {parte.modo === "anadir" ? " · añadir" : " · reemplazar"}
                  </div>
                  <AreaTexto
                    className="!min-h-[60px] text-[14px]"
                    value={parte.edit}
                    onChange={(e) =>
                      setPropuesta((prev) => ({
                        ...prev,
                        partes: prev.partes.map((x) => (x.id === parte.id ? { ...x, edit: e.target.value } : x)),
                      }))
                    }
                  />
                  <div className="mt-2 flex gap-2">
                    <Boton pequeno data-testid="btn-aceptar-parte" onClick={() => resolver(parte, "aceptar")}>
                      Aceptar
                    </Boton>
                    <Boton pequeno variante="secundario" data-testid="btn-descartar-parte" onClick={() => resolver(parte, "descartar")}>
                      Descartar
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          )}
          {propuesta && propuesta.partes.length === 0 && (
            <p className="mt-4 text-[13px] text-tinta2">Sin propuestas pendientes.</p>
          )}
        </>
      )}
    </aside>
  );
}
