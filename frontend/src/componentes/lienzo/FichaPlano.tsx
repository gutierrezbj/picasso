import React, { useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import Boton from "../Boton";
import Selector from "../Selector";
import { Campo, Entrada, AreaTexto } from "../Campo";
import PanelPrompt from "./PanelPrompt";
import { useAutoguardado } from "../../estado/useAutoguardado";
import { useGuardado } from "../../estado/GuardadoContext";
import { api } from "../../api/cliente";
import type { Direccion, OpcionesDireccion, Plano, RepartoLienzo } from "../../tipos";

interface Props {
  plano: Plano;
  etiqueta: string;
  reparto: RepartoLienzo[];
  opciones: OpcionesDireccion;
  urlMedio: (medioId: string) => string;
  onCambiado: () => void | Promise<unknown>;
}

interface Editable {
  que_se_muestra: string;
  modalidad: "imagen" | "video";
  duracion_s: string;
  elementos: string[];
  direccion: Direccion;
  plano_anterior_encadenado: boolean;
}

type Pestana = "direccion" | "continuidad" | "correcciones";

const CAMPOS_IMAGEN: (keyof Direccion)[] = ["encuadre", "angulo"];
const CAMPOS_VIDEO: (keyof Direccion)[] = [
  "encuadre_inicio",
  "angulo_inicio",
  "encuadre_final",
  "angulo_final",
];
const CAMPOS_COMUNES: (keyof Direccion)[] = [
  "movimiento_camara",
  "optica",
  "profundidad_campo",
  "luz_direccion",
  "luz_calidad",
  "luz_momento",
  "temperatura_color",
];

const ETIQUETAS_VIDEO: Partial<Record<keyof Direccion, string>> = {
  encuadre_inicio: "Encuadre de inicio",
  angulo_inicio: "Ángulo de inicio",
  encuadre_final: "Encuadre de final",
  angulo_final: "Ángulo de final",
};

const BASE_OPCION = (clave: keyof Direccion): string =>
  String(clave).replace("_inicio", "").replace("_final", "");

export default function FichaPlano({
  plano,
  etiqueta,
  reparto,
  opciones,
  urlMedio,
  onCambiado,
}: Props) {
  const [pestana, setPestana] = useState<Pestana>("direccion");
  const [datos, setDatos] = useState<Editable>({
    que_se_muestra: plano.que_se_muestra,
    modalidad: plano.modalidad,
    duracion_s: plano.duracion_s === null ? "" : String(plano.duracion_s),
    elementos: plano.elementos,
    direccion: plano.direccion,
    plano_anterior_encadenado: plano.plano_anterior_encadenado,
  });
  const [nuevaCorreccion, setNuevaCorreccion] = useState("");
  const [historial, setHistorial] = useState(false);
  const sello = useRef(plano.updated_at);
  const g = useGuardado();

  const cuerpo = () => ({
    ...datos,
    duracion_s: datos.duracion_s === "" ? null : Number(datos.duracion_s),
  });

  useAutoguardado(
    datos,
    async () => {
      const guardado = await api.editarPlano(plano.id, { ...cuerpo(), updated_at: sello.current });
      sello.current = guardado.updated_at;
      setDatos((d) => ({ ...d, direccion: guardado.direccion }));
      await onCambiado();
    },
    {
      recargar: async () => {
        await onCambiado();
        g.guardado();
      },
      sobrescribir: async () => {
        const fresco = await api.lienzo(plano.pieza_id);
        const actual = fresco.escenas
          .flatMap((e) => e.planos)
          .concat(fresco.planos_sin_escena)
          .find((p) => p.id === plano.id);
        const guardado = await api.editarPlano(plano.id, {
          ...cuerpo(),
          updated_at: actual?.updated_at,
        });
        sello.current = guardado.updated_at;
        await onCambiado();
        g.guardado();
      },
    }
  );

  const setDireccion = (clave: keyof Direccion, valor: string) =>
    setDatos((d) => ({ ...d, direccion: { ...d.direccion, [clave]: valor || null } }));

  const opcionesDe = (clave: keyof Direccion) => {
    const base = opciones[BASE_OPCION(clave)];
    const lista = base?.opciones || [];
    return [{ valor: "", texto: "— sin elegir —" }, ...lista.map((o) => ({ valor: o, texto: o }))];
  };

  const etiquetaDe = (clave: keyof Direccion) =>
    ETIQUETAS_VIDEO[clave] || opciones[BASE_OPCION(clave)]?.etiqueta || String(clave);

  const campoSelector = (clave: keyof Direccion) => (
    <Campo key={String(clave)} etiqueta={etiquetaDe(clave)}>
      <Selector
        data-testid={`direccion-${String(clave)}`}
        valor={(datos.direccion[clave] as string) || ""}
        opciones={opcionesDe(clave)}
        onChange={(v) => setDireccion(clave, v)}
      />
    </Campo>
  );

  const alternarVariable = (repartoId: string, rasgo: string) =>
    setDatos((d) => {
      const actuales = d.direccion.vestuario_y_variables[repartoId] || [];
      const nuevos = actuales.includes(rasgo)
        ? actuales.filter((r) => r !== rasgo)
        : [...actuales, rasgo];
      return {
        ...d,
        direccion: {
          ...d.direccion,
          vestuario_y_variables: { ...d.direccion.vestuario_y_variables, [repartoId]: nuevos },
        },
      };
    });

  const pendientes = plano.correcciones.filter((c) => c.estado === "pendiente");
  const hechas = plano.correcciones.filter((c) => c.estado === "hecha");

  const pestanaBtn = (id: Pestana, texto: string) => (
    <button
      key={id}
      data-testid={`pestana-${id}`}
      onClick={() => setPestana(id)}
      className={
        "rounded-control px-3 py-1.5 text-[14px] leading-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
        (pestana === id ? "bg-acento text-white" : "text-tinta2 hover:bg-superficie2")
      }
    >
      {texto}
    </button>
  );

  return (
    <div data-testid="ficha-plano">
      <div className="flex flex-wrap gap-1.5 border-b border-linea pb-3">
        {pestanaBtn("direccion", "Dirección")}
        {pestanaBtn("continuidad", "Continuidad")}
        {pestanaBtn("correcciones", `Correcciones${pendientes.length ? ` (${pendientes.length})` : ""}`)}
      </div>

      {pestana === "direccion" && (
        <div className="mt-4 flex flex-col gap-4">
          <Campo etiqueta="Qué se muestra" ayuda="Lo único obligatorio (§8).">
            <AreaTexto
              data-testid="plano-que-se-muestra"
              value={datos.que_se_muestra}
              onChange={(e) => setDatos({ ...datos, que_se_muestra: e.target.value })}
              className="min-h-[72px]"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Modalidad">
              <Selector
                data-testid="plano-modalidad"
                valor={datos.modalidad}
                opciones={[
                  { valor: "imagen", texto: "Imagen" },
                  { valor: "video", texto: "Vídeo" },
                ]}
                onChange={(v) => setDatos({ ...datos, modalidad: v as "imagen" | "video" })}
              />
            </Campo>
            <Campo etiqueta="Duración (s)">
              <Entrada
                data-testid="plano-duracion"
                type="number"
                min="0"
                step="0.5"
                value={datos.duracion_s}
                onChange={(e) => setDatos({ ...datos, duracion_s: e.target.value })}
              />
            </Campo>
          </div>

          <Campo etiqueta="Protagonista visual">
            <Selector
              data-testid="direccion-protagonista_visual"
              valor={datos.direccion.protagonista_visual || ""}
              opciones={[
                { valor: "", texto: "— sin elegir —" },
                ...reparto.map((r) => ({ valor: r.elemento.nombre, texto: r.elemento.nombre })),
                { valor: "El entorno", texto: "El entorno" },
              ]}
              onChange={(v) => setDireccion("protagonista_visual", v)}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            {(datos.modalidad === "video" ? CAMPOS_VIDEO : CAMPOS_IMAGEN).map(campoSelector)}
            {CAMPOS_COMUNES.map(campoSelector)}
          </div>

          {datos.modalidad === "video" && (
            <Campo etiqueta="Acción" ayuda="Qué ocurre durante el plano.">
              <AreaTexto
                data-testid="direccion-accion"
                value={datos.direccion.accion || ""}
                onChange={(e) => setDireccion("accion", e.target.value)}
                className="min-h-[60px]"
              />
            </Campo>
          )}

          <Campo etiqueta="Ambiente">
            <AreaTexto
              data-testid="direccion-ambiente"
              value={datos.direccion.ambiente || ""}
              onChange={(e) => setDireccion("ambiente", e.target.value)}
              className="min-h-[60px]"
            />
          </Campo>

          <Campo etiqueta="Acabado">
            <Entrada
              data-testid="direccion-acabado"
              value={datos.direccion.acabado || ""}
              onChange={(e) => setDireccion("acabado", e.target.value)}
            />
          </Campo>

          <Campo etiqueta="Negativos" ayuda="Lo que no debe aparecer.">
            <Entrada
              data-testid="direccion-negativos"
              value={datos.direccion.negativos || ""}
              onChange={(e) => setDireccion("negativos", e.target.value)}
            />
          </Campo>

          <Campo etiqueta="Elementos del plano" ayuda="Subconjunto de los de la escena.">
            <div className="flex flex-wrap gap-2" data-testid="plano-elementos">
              {reparto.map((r) => {
                const activo = datos.elementos.includes(r.id);
                return (
                  <button
                    key={r.id}
                    data-testid={`plano-chip-${r.elemento.nombre}`}
                    aria-pressed={activo}
                    onClick={() =>
                      setDatos({
                        ...datos,
                        elementos: activo
                          ? datos.elementos.filter((x) => x !== r.id)
                          : [...datos.elementos, r.id],
                      })
                    }
                    className={
                      "rounded-control border px-3 py-1.5 text-[13px] leading-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                      (activo
                        ? "border-acento bg-acentoSuave text-acentoTinta"
                        : "border-linea bg-superficie text-tinta2")
                    }
                  >
                    {r.elemento.nombre}
                  </button>
                );
              })}
            </div>
          </Campo>

          <Campo etiqueta="Vestuario y variables" ayuda="Qué rasgos variables aplican en este plano.">
            {plano.continuidad.length === 0 ? (
              <span className="text-[14px] text-tinta3">Añade elementos al plano.</span>
            ) : (
              <div className="flex flex-col gap-3" data-testid="plano-variables">
                {plano.continuidad.map((c) => (
                  <div key={c.reparto_id}>
                    <div className="text-[13px] leading-[18px] font-medium text-tinta">{c.nombre}</div>
                    {c.rasgos_variables.length === 0 ? (
                      <span className="text-[13px] text-tinta3">sin rasgos variables</span>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {c.rasgos_variables.map((r) => {
                          const activo = (
                            datos.direccion.vestuario_y_variables[c.reparto_id] || []
                          ).includes(r);
                          return (
                            <button
                              key={r}
                              aria-pressed={activo}
                              onClick={() => alternarVariable(c.reparto_id, r)}
                              className={
                                "rounded-control border px-2 py-1 text-[12px] leading-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                                (activo
                                  ? "border-acento bg-acentoSuave text-acentoTinta"
                                  : "border-linea bg-superficie text-tinta2")
                              }
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Campo>

          <label className="flex items-center gap-2 text-[14px] leading-[20px] text-tinta">
            <input
              type="checkbox"
              data-testid="plano-encadenado"
              checked={datos.plano_anterior_encadenado}
              onChange={(e) =>
                setDatos({ ...datos, plano_anterior_encadenado: e.target.checked })
              }
              className="h-4 w-4 accent-[var(--color-acento)]"
            />
            Encadenado con el plano anterior
          </label>

          <div className="border-t border-linea pt-4">
            <PanelPrompt planoId={plano.id} sello={plano.updated_at} />
          </div>
        </div>
      )}

      {pestana === "continuidad" && (
        <div className="mt-4 flex flex-col gap-5" data-testid="pestana-continuidad-contenido">
          {plano.continuidad.length === 0 && (
            <p className="text-[14px] leading-[20px] text-tinta2">
              Este plano no tiene elementos todavía.
            </p>
          )}
          {plano.continuidad.map((c) => (
            <section key={c.reparto_id} data-testid={`continuidad-${c.nombre}`}>
              <h3 className="text-[14px] leading-[20px] font-semibold text-tinta">
                {c.nombre} <span className="font-normal text-tinta2">v{c.version}</span>
              </h3>
              <p className="mt-1 text-[13px] leading-[18px] text-tinta2">
                Rasgos fijos:{" "}
                {c.rasgos_fijos.length ? c.rasgos_fijos.join(" · ") : "— sin rasgos —"}
              </p>
              <p className="mt-1 text-[13px] leading-[18px] text-tinta2">
                En este plano:{" "}
                {c.rasgos_variables_aplican.length
                  ? c.rasgos_variables_aplican.join(" · ")
                  : "— ninguno marcado —"}
              </p>
              <p className="mt-1 text-[13px] leading-[18px] text-tinta2">
                Referencias que se enviarán: {c.referencias.length || "ninguna"}
              </p>
              {c.referencias.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.referencias.map((r, i) => (
                    <img
                      key={i}
                      src={urlMedio(r.medio_id)}
                      alt={r.rol}
                      className="h-16 rounded-control border border-linea object-contain"
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {pestana === "correcciones" && (
        <div className="mt-4" data-testid="pestana-correcciones-contenido">
          <Campo etiqueta="Corregir" ayuda="En lenguaje llano: «que no gire la cabeza».">
            <AreaTexto
              data-testid="correccion-texto"
              value={nuevaCorreccion}
              onChange={(e) => setNuevaCorreccion(e.target.value)}
              className="min-h-[60px]"
            />
          </Campo>
          <Boton
            pequeno
            className="mt-3"
            data-testid="btn-guardar-correccion"
            disabled={!nuevaCorreccion.trim()}
            onClick={async () => {
              await api.crearCorreccion(plano.id, nuevaCorreccion.trim());
              setNuevaCorreccion("");
              await onCambiado();
            }}
          >
            Guardar corrección
          </Boton>
          <p className="mt-2 text-[12px] leading-[16px] text-tinta2">
            En la Fase 5 se guarda como pendiente. En la Fase 6 se convierte en una operación
            con coste.
          </p>

          <ul className="mt-5 flex flex-col gap-3" data-testid="lista-correcciones">
            {pendientes.length === 0 && (
              <li className="text-[14px] leading-[20px] text-tinta3">Sin correcciones pendientes.</li>
            )}
            {pendientes.map((c) => (
              <li
                key={c.id}
                data-testid={`correccion-${c.id}`}
                className="rounded-card border border-linea bg-superficie2 p-3"
              >
                <p className="text-[14px] leading-[20px] text-tinta">{c.texto}</p>
                <div className="mt-2 flex gap-2">
                  <Boton
                    pequeno
                    variante="secundario"
                    data-testid={`correccion-hecha-${c.id}`}
                    onClick={async () => {
                      await api.editarCorreccion(plano.id, c.id, "hecha");
                      await onCambiado();
                    }}
                  >
                    <Check size={14} strokeWidth={1.9} /> Hecha
                  </Boton>
                  <Boton
                    pequeno
                    variante="texto"
                    data-testid={`correccion-borrar-${c.id}`}
                    onClick={async () => {
                      await api.borrarCorreccion(plano.id, c.id);
                      await onCambiado();
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.9} /> Borrar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>

          {hechas.length > 0 && (
            <div className="mt-5">
              <button
                data-testid="btn-historial-correcciones"
                onClick={() => setHistorial(!historial)}
                className="text-[14px] leading-[20px] text-acento underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
              >
                {historial ? "Ocultar" : "Ver"} historial ({hechas.length})
              </button>
              {historial && (
                <ul className="mt-3 flex flex-col gap-2" data-testid="historial-correcciones">
                  {hechas.map((c) => (
                    <li key={c.id} className="text-[13px] leading-[18px] text-tinta2">
                      · {c.texto} <span className="text-tinta3">— hecha</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
