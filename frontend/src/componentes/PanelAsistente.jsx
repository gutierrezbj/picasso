import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import Boton from "./Boton";
import { AreaTexto } from "./Campo";
import Selector from "./Selector";
import { api } from "../api/cliente";
import { useAsistenteEstado } from "../api/hooks";
import { ETIQUETA_CAMPO, CAMPOS_POR_TIPO } from "../lib/campos";

// Panel del asistente (§10). Propone; nada se escribe sin que el usuario acepte.
// Las propuestas se ACUMULAN: pedir algo nuevo no borra las pendientes.
export default function PanelAsistente({ proyectoId, tipo, desActual, onAplicado }) {
  const { data: estado } = useAsistenteEstado();
  const [items, setItems] = useState([]); // {propId,id,tipo,pregunta,destino_campo,texto,modo,edit,destinoSel}
  const [campo, setCampo] = useState(CAMPOS_POR_TIPO[tipo]?.[0] || "intencion");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const disponible = estado?.disponible;
  const campos = CAMPOS_POR_TIPO[tipo] || [];

  const pedir = async (tarea, extra) => {
    setCargando(true);
    setError(null);
    try {
      const p = await api.proponer(proyectoId, tarea, extra);
      const nuevos = p.partes.map((x) => ({
        ...x,
        propId: p.id,
        edit: x.texto || "",
        destinoSel: x.destino_campo || campos[0] || "notas",
      }));
      setItems((prev) => [...nuevos, ...prev]); // acumular
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const resolver = async (item, accion) => {
    const cuerpo =
      accion === "aceptar"
        ? { accion, texto: item.edit, destino_campo: item.tipo === "pregunta" ? item.destinoSel : item.destino_campo }
        : { accion };
    await api.resolverParte(item.propId, item.id, cuerpo);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    if (accion === "aceptar") onAplicado?.();
  };

  const actualizar = (id, campos_) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...campos_ } : x)));

  return (
    <aside data-testid="panel-asistente" className="w-full rounded-panel border border-linea bg-superficie2 p-5 lg:w-[400px] lg:shrink-0">
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
              <Selector data-testid="select-campo-proponer" valor={campo} onChange={setCampo} opciones={campos.map((c) => ({ valor: c, texto: ETIQUETA_CAMPO[c] }))} />
              <Boton pequeno data-testid="btn-proponer-campo" disabled={cargando} onClick={() => pedir("proponer_campo", { campo })}>
                Proponer
              </Boton>
            </div>
          </div>

          {cargando && <p className="mt-4 text-[13px] text-tinta2">Pensando…</p>}
          {error && <p className="mt-4 text-[13px] text-error">{error}</p>}

          {items.length > 0 && (
            <div className="mt-5 flex flex-col gap-4" data-testid="propuestas">
              {items.map((item) => (
                <div key={item.id} className="rounded-card border border-linea bg-superficie p-3" data-testid="propuesta-parte">
                  {item.tipo === "pregunta" ? (
                    <>
                      <div className="mb-2 text-[14px] font-medium text-tinta" data-testid="propuesta-pregunta">{item.pregunta}</div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[13px] text-tinta2">Responder en:</span>
                        <Selector
                          data-testid="select-destino-respuesta"
                          valor={item.destinoSel}
                          onChange={(v) => actualizar(item.id, { destinoSel: v })}
                          opciones={campos.map((c) => ({ valor: c, texto: ETIQUETA_CAMPO[c] }))}
                        />
                      </div>
                      <AreaTexto
                        className="!min-h-[60px] text-[14px]"
                        placeholder="Tu respuesta…"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <div className="mb-2 text-[13px] font-medium text-tinta2">
                        {ETIQUETA_CAMPO[item.destino_campo] || item.destino_campo}
                        {item.modo === "anadir" ? " · añadir" : " · reemplazar"}
                      </div>
                      {item.modo !== "anadir" && (
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          <div className="rounded-control bg-superficie2 p-2" data-testid="texto-actual">
                            <div className="mb-1 text-[12px] text-tinta3">Actual</div>
                            <div className="text-[13px] text-tinta2 whitespace-pre-wrap">
                              {(desActual && desActual[item.destino_campo]) || "— vacío —"}
                            </div>
                          </div>
                          <div className="rounded-control bg-acentoSuave p-2">
                            <div className="mb-1 text-[12px] text-acento">Propuesto</div>
                            <div className="text-[13px] text-tinta whitespace-pre-wrap">{item.edit}</div>
                          </div>
                        </div>
                      )}
                      <AreaTexto
                        className="!min-h-[60px] text-[14px]"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                    </>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Boton pequeno data-testid="btn-aceptar-parte" onClick={() => resolver(item, "aceptar")}>
                      Aceptar
                    </Boton>
                    <Boton pequeno variante="secundario" data-testid="btn-descartar-parte" onClick={() => resolver(item, "descartar")}>
                      Descartar
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
