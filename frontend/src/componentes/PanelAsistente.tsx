import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import Boton from "./Boton";
import { AreaTexto, Entrada } from "./Campo";
import Selector from "./Selector";
import { api } from "../api/cliente";
import { useAsistenteEstado } from "../api/hooks";
import { ETIQUETA_CAMPO, CAMPOS_POR_TIPO } from "../lib/campos";

const NOMBRE_CLASE: Record<string, any> = {
  personaje: "personajes",
  producto: "productos",
  objeto: "objetos",
  escenario: "escenarios",
};

// Panel del asistente (§10). Propone; nada se escribe sin que el usuario acepte.
// Las propuestas se ACUMULAN: pedir algo nuevo no borra las pendientes.
interface PropsPanelAsistente {
  proyectoId: string;
  tipo: string;
  desActual?: any;
  onAplicado?: () => void | Promise<unknown>;
  modo?: string;
  clase?: string | null;
  preguntasFormato?: any[];
  piezaId?: string | null;
  escenas?: any[];
  peticionPendiente?: any;
  onPeticionConsumida?: () => void;
}

export default function PanelAsistente({
  proyectoId,
  tipo,
  desActual,
  onAplicado,
  modo = "desarrollo",
  clase = null,
  preguntasFormato = [],
  piezaId = null,
  escenas = [],
  peticionPendiente = null,
  onPeticionConsumida,
}: PropsPanelAsistente) {
  const { data: estado } = useAsistenteEstado();
  const [items, setItems] = useState([]);
  const [campo, setCampo] = useState(CAMPOS_POR_TIPO[tipo]?.[0] || "intencion");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [claseGuion, setClaseGuion] = useState("personaje");
  const pedirRef = useRef(null);

  const disponible = estado?.disponible;
  const campos = CAMPOS_POR_TIPO[tipo] || [];

  // Destinos posibles de una respuesta: los campos del Desarrollo y, además,
  // las preguntas del formato del proyecto (§6.1).
  const destinos = [
    ...campos.map((c: any) => ({ valor: c, texto: ETIQUETA_CAMPO[c] })),
    ...preguntasFormato.map((q) => ({ valor: `formato:${q.clave}`, texto: `Formato · ${q.pregunta}` })),
  ];

  const pedir = async (tarea: string, extra?: Record<string, unknown>) => {
    setCargando(true);
    setError(null);
    try {
      const p = await api.proponer(proyectoId, tarea, { ...(extra || {}), pieza_id: piezaId });
      if (!p.partes.length) {
        setError(
          tarea === "detectar_elementos"
            ? "No hay nada que proponer: el desarrollo no menciona nombres nuevos de esta clase."
            : "No hay nada que proponer con lo que hay escrito."
        );
      }
      const nuevos = p.partes.map((x: any) => ({
        ...x,
        propId: p.id,
        edit: x.tipo === "elemento" || x.tipo === "escena" ? x.nombre || "" : x.texto || "",
        destinoSel: x.destino_campo || destinos[0]?.valor || "notas",
      }));
      setItems((prev) => [...nuevos, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const resolver = async (item: any, accion: any) => {
    setError(null);
    const cuerpo =
      accion === "aceptar"
        ? {
            accion,
            texto: item.edit,
            destino_campo: item.tipo === "pregunta" ? item.destinoSel : item.destino_campo,
          }
        : { accion };
    try {
      await api.resolverParte(item.propId, item.id, cuerpo);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (accion === "aceptar") onAplicado?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const actualizar = (id: string, campos_: any) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...campos_ } : x)));

  pedirRef.current = pedir;

  // Peticiones lanzadas desde fuera del panel (p. ej. «Pedir reescritura» en una escena).
  useEffect(() => {
    if (!peticionPendiente || !disponible) return;
    const { tarea, ...extra } = peticionPendiente;
    pedirRef.current(tarea, extra);
    onPeticionConsumida?.();
    // eslint-disable-next-line
  }, [peticionPendiente, disponible]);

  return (
    <aside
      data-testid="panel-asistente"
      className="w-full rounded-panel border border-linea bg-superficie2 p-5 lg:w-[400px] lg:shrink-0"
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
            {modo === "guion" ? (
              <>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="btn-proponer-escenas"
                  disabled={cargando}
                  onClick={() => pedir("proponer_escenas")}
                >
                  Proponer escenas
                </Boton>
                <div className="flex gap-2">
                  <Selector
                    data-testid="select-clase-detectar"
                    valor={claseGuion}
                    onChange={setClaseGuion}
                    opciones={[
                      { valor: "personaje", texto: "Personajes" },
                      { valor: "objeto", texto: "Objetos" },
                      { valor: "producto", texto: "Productos" },
                      { valor: "escenario", texto: "Escenarios" },
                    ]}
                  />
                  <Boton
                    pequeno
                    data-testid="btn-detectar-elementos"
                    disabled={cargando}
                    onClick={() => pedir("detectar_elementos", { clase: claseGuion })}
                  >
                    Detectar
                  </Boton>
                </div>
                <p className="text-[13px] leading-[18px] text-tinta2">
                  {escenas.length} escena{escenas.length === 1 ? "" : "s"} en el guion. Pide una
                  reescritura desde cada escena.
                </p>
              </>
            ) : modo === "elementos" ? (
              <Boton
                pequeno
                variante="secundario"
                data-testid="btn-detectar-elementos"
                disabled={cargando || !clase}
                onClick={() => pedir("detectar_elementos", { clase })}
              >
                Detectar {NOMBRE_CLASE[clase] || "elementos"} que menciona la idea
              </Boton>
            ) : (
              <>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="btn-hacer-preguntas"
                  disabled={cargando}
                  onClick={() => pedir("hacer_preguntas")}
                >
                  Hacer preguntas
                </Boton>
                <Boton
                  pequeno
                  variante="secundario"
                  data-testid="btn-ordenar-notas"
                  disabled={cargando}
                  onClick={() => pedir("ordenar_notas")}
                >
                  Ordenar mis notas
                </Boton>
                <div className="flex gap-2">
                  <Selector
                    data-testid="select-campo-proponer"
                    valor={campo}
                    onChange={setCampo}
                    opciones={campos.map((c: any) => ({ valor: c, texto: ETIQUETA_CAMPO[c] }))}
                  />
                  <Boton
                    pequeno
                    data-testid="btn-proponer-campo"
                    disabled={cargando}
                    onClick={() => pedir("proponer_campo", { campo })}
                  >
                    Proponer
                  </Boton>
                </div>
              </>
            )}
          </div>

          {cargando && <p className="mt-4 text-[13px] text-tinta2">Pensando…</p>}
          {error && (
            <p className="mt-4 text-[13px] text-tinta2" data-testid="asistente-aviso">
              {error}
            </p>
          )}

          {items.length > 0 && (
            <div className="mt-5 flex flex-col gap-4" data-testid="propuestas">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-card border border-linea bg-superficie p-3"
                  data-testid="propuesta-parte"
                >
                  {item.tipo === "pregunta" && (
                    <>
                      <div className="mb-2 text-[14px] font-medium text-tinta" data-testid="propuesta-pregunta">
                        {item.pregunta}
                      </div>
                      <div className="mb-2 flex flex-col gap-1">
                        <span className="text-[13px] text-tinta2">Responder en:</span>
                        <Selector
                          data-testid="select-destino-respuesta"
                          valor={item.destinoSel}
                          onChange={(v) => actualizar(item.id, { destinoSel: v })}
                          opciones={destinos}
                        />
                      </div>
                      <AreaTexto
                        className="!min-h-[60px] text-[14px]"
                        placeholder="Tu respuesta…"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                    </>
                  )}

                  {item.tipo === "escena" && (
                    <>
                      <div className="mb-2 text-[13px] font-medium text-tinta2">Escena propuesta</div>
                      <Entrada
                        data-testid="propuesta-titulo-escena"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                      {item.texto && (
                        <p className="mt-2 text-[13px] leading-[18px] text-tinta2">{item.texto}</p>
                      )}
                    </>
                  )}

                  {item.tipo === "escena_campo" && (
                    <>
                      <div className="mb-2 text-[13px] font-medium text-tinta2">
                        Reescritura · {ETIQUETA_CAMPO[item.destino_campo] || item.destino_campo}
                      </div>
                      <AreaTexto
                        className="!min-h-[60px] text-[14px]"
                        data-testid="propuesta-reescritura"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                    </>
                  )}

                  {item.tipo === "elemento" && (
                    <>
                      <div className="mb-2 text-[13px] font-medium text-tinta2">
                        Elemento propuesto · {item.clase}
                      </div>
                      <Entrada
                        data-testid="propuesta-nombre-elemento"
                        value={item.edit}
                        onChange={(e) => actualizar(item.id, { edit: e.target.value })}
                      />
                      {item.texto && (
                        <p className="mt-2 text-[13px] leading-[18px] text-tinta2">{item.texto}</p>
                      )}
                      <p className="mt-2 text-[13px] leading-[18px] text-tinta2">
                        Al aceptar se crea en el espacio y entra en el reparto con su ficha v1 en
                        borrador. La descripción y la aprobación las haces tú.
                      </p>
                    </>
                  )}

                  {item.tipo === "campo" && (
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
                    <Boton
                      pequeno
                      variante="secundario"
                      data-testid="btn-descartar-parte"
                      onClick={() => resolver(item, "descartar")}
                    >
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
