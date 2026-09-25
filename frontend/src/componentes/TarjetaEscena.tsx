import React, { useRef, useState } from "react";
import { ChevronUp, ChevronDown, Trash2, GripVertical, Plus, X, Sparkles } from "lucide-react";
import Boton from "./Boton";
import Selector from "./Selector";
import { Campo, Entrada, AreaTexto } from "./Campo";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";

// Una escena del guion (§6.3). Se edita en sitio con autoguardado.
export default function TarjetaEscena({
  escena,
  indice,
  total,
  reparto,
  editable,
  onMover,
  onBorrar,
  onCambiada,
  onCrearElemento,
  onReescribir,
  arrastre,
}) {
  const [datos, setDatos] = useState({
    titulo: escena.titulo || "",
    que_ocurre: escena.que_ocurre || "",
    que_se_ve: escena.que_se_ve || "",
    intencion: escena.intencion || "",
    elementos: escena.elementos || [],
    dialogos: escena.dialogos || [],
    sonido_previsto: escena.sonido_previsto || "",
    duracion_orientativa_s: escena.duracion_orientativa_s ?? "",
  });
  const updated = useRef(escena.updated_at);

  useAutoguardado(
    datos,
    async () => {
      const guardada = await api.editarEscena(escena.id, {
        ...datos,
        duracion_orientativa_s:
          datos.duracion_orientativa_s === "" ? null : Number(datos.duracion_orientativa_s),
        updated_at: updated.current,
      });
      updated.current = guardada.updated_at;
      onCambiada?.();
    },
    {
      activo: editable,
      // Conflicto de versión (§12).
      recargar: async () => {
        await onCambiada?.();
      },
      sobrescribir: async () => {
        const fresca = await api.escena(escena.id);
        const guardada = await api.editarEscena(escena.id, {
          ...datos,
          duracion_orientativa_s:
            datos.duracion_orientativa_s === "" ? null : Number(datos.duracion_orientativa_s),
          updated_at: fresca.updated_at,
        });
        updated.current = guardada.updated_at;
        await onCambiada?.();
      },
    }
  );

  const set = (k, v) => setDatos((d) => ({ ...d, [k]: v }));
  // §6.3: solo el narrador o un personaje que esté en los elementos de esta escena.
  const personajesEnEscena = reparto.filter(
    (r) => r.elemento.clase === "personaje" && datos.elementos.includes(r.id)
  );
  const hablantes = [
    { valor: "narrador", texto: "Narrador" },
    ...personajesEnEscena.map((r) => ({ valor: r.elemento_id, texto: r.elemento.nombre })),
  ];
  const fueraDeEscena = (hablante) =>
    hablante !== "narrador" && !personajesEnEscena.some((r) => r.elemento_id === hablante);
  const nombreHablante = (hablante) =>
    reparto.find((r) => r.elemento_id === hablante)?.elemento.nombre || "Elemento fuera del reparto";
  const opcionesHablante = (hablante) =>
    fueraDeEscena(hablante)
      ? [
          ...hablantes,
          { valor: hablante, texto: `${nombreHablante(hablante)} · Ya no está en los elementos de la escena` },
        ]
      : hablantes;

  const alternar = (entradaId) =>
    set(
      "elementos",
      datos.elementos.includes(entradaId)
        ? datos.elementos.filter((x) => x !== entradaId)
        : [...datos.elementos, entradaId]
    );

  return (
    <li
      data-testid={`escena-${indice + 1}`}
      draggable={editable}
      onDragStart={(e) => {
        if (!editable) return;
        e.dataTransfer.setData("text/plain", String(indice));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => editable && e.preventDefault()}
      onDrop={(e) => {
        if (!editable) return;
        e.preventDefault();
        const desde = Number(e.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(desde) && desde !== indice) arrastre?.(desde, indice);
      }}
      className="rounded-panel border border-linea bg-superficie p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {editable && (
            <span className="cursor-grab text-tinta3" aria-hidden data-testid={`arrastrar-escena-${indice + 1}`}>
              <GripVertical size={18} strokeWidth={1.9} />
            </span>
          )}
          <span className="font-mono text-[13px] leading-[18px] text-tinta2">
            Escena {escena.orden}
          </span>
          <div className="min-w-0 flex-1">
            {editable ? (
              <Entrada
                data-testid={`escena-titulo-${indice + 1}`}
                placeholder="Título de la escena"
                value={datos.titulo}
                onChange={(e) => set("titulo", e.target.value)}
              />
            ) : (
              <span className="block truncate text-[18px] leading-[24px] font-semibold text-tinta">
                {datos.titulo || "Escena sin título"}
              </span>
            )}
          </div>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <button
              data-testid={`subir-escena-${indice + 1}`}
              aria-label={`Subir escena ${escena.orden}`}
              disabled={indice === 0}
              onClick={() => onMover(escena.id, "subir")}
              className="flex h-10 w-10 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <ChevronUp size={18} strokeWidth={1.9} />
            </button>
            <button
              data-testid={`bajar-escena-${indice + 1}`}
              aria-label={`Bajar escena ${escena.orden}`}
              disabled={indice === total - 1}
              onClick={() => onMover(escena.id, "bajar")}
              className="flex h-10 w-10 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <ChevronDown size={18} strokeWidth={1.9} />
            </button>
            <button
              data-testid={`borrar-escena-${indice + 1}`}
              aria-label={`Borrar escena ${escena.orden}`}
              onClick={() => onBorrar(escena.id)}
              className="flex h-10 w-10 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <Trash2 size={16} strokeWidth={1.9} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[
          ["que_ocurre", "Qué ocurre", "Lo que pasa en la escena."],
          ["que_se_ve", "Qué se ve", "Lo que entra en el cuadro."],
          ["intencion", "Intención", "Para qué está esta escena."],
          ["sonido_previsto", "Sonido previsto", "Ambiente, música, efectos."],
        ].map(([clave, etiqueta, ayuda]) => (
          <Campo key={clave} etiqueta={etiqueta} ayuda={ayuda}>
            {editable ? (
              <div className="flex flex-col gap-2">
                <AreaTexto
                  data-testid={`escena-${clave}-${indice + 1}`}
                  className="!min-h-[84px]"
                  value={datos[clave]}
                  onChange={(e) => set(clave, e.target.value)}
                />
                {onReescribir && (
                  <Boton
                    pequeno
                    variante="texto"
                    data-testid={`reescribir-${clave}-${indice + 1}`}
                    onClick={() => onReescribir(escena, clave)}
                  >
                    <Sparkles size={15} strokeWidth={1.9} /> Pedir reescritura
                  </Boton>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                {datos[clave] || "— vacío —"}
              </p>
            )}
          </Campo>
        ))}
      </div>

      <div className="mt-5">
        <Campo etiqueta="Elementos" ayuda="Solo los del reparto de este proyecto.">
          <div className="flex flex-wrap items-center gap-2" data-testid={`escena-elementos-${indice + 1}`}>
            {reparto.length === 0 && (
              <span className="text-[14px] leading-[20px] text-tinta3">
                Este proyecto todavía no tiene elementos en el reparto.
              </span>
            )}
            {reparto.map((r) => {
              const puesto = datos.elementos.includes(r.id);
              if (!editable && !puesto) return null;
              return (
                <button
                  key={r.id}
                  data-testid={`chip-${r.elemento_id}-${indice + 1}`}
                  disabled={!editable}
                  onClick={() => alternar(r.id)}
                  aria-pressed={puesto}
                  className={
                    "min-h-[36px] rounded-full px-3 text-[13px] leading-[18px] transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                    (puesto
                      ? "bg-acento text-superficie"
                      : "border border-linea bg-superficie text-tinta2 hover:bg-superficie2")
                  }
                >
                  {r.elemento.nombre}
                  <span className="ml-2 opacity-70">{r.elemento.clase}</span>
                </button>
              );
            })}
            {editable && onCrearElemento && (
              <Boton pequeno variante="secundario" data-testid={`crear-elemento-${indice + 1}`} onClick={onCrearElemento}>
                <Plus size={15} strokeWidth={1.9} /> Falta un elemento
              </Boton>
            )}
          </div>
        </Campo>
      </div>

      <div className="mt-5">
        <Campo etiqueta="Diálogos" ayuda="Quién habla y qué dice.">
          <div className="flex flex-col gap-2" data-testid={`escena-dialogos-${indice + 1}`}>
            {datos.dialogos.length === 0 && !editable && (
              <span className="text-[14px] leading-[20px] text-tinta3">— sin diálogo —</span>
            )}
            {datos.dialogos.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <div className="w-[180px]">
                  {editable ? (
                    <Selector
                      data-testid={`dialogo-hablante-${indice + 1}-${i}`}
                      valor={d.hablante}
                      onChange={(v) =>
                        set("dialogos", datos.dialogos.map((x, j) => (j === i ? { ...x, hablante: v } : x)))
                      }
                      opciones={opcionesHablante(d.hablante)}
                    />
                  ) : (
                    <span className="text-[14px] leading-[20px] font-medium text-tinta">
                      {d.hablante === "narrador" ? "Narrador" : nombreHablante(d.hablante)}
                    </span>
                  )}
                  {fueraDeEscena(d.hablante) && (
                    <p
                      data-testid={`dialogo-hablante-invalido-${indice + 1}-${i}`}
                      className="mt-1 text-[12px] leading-[16px] text-aviso"
                    >
                      Ya no está en los elementos de la escena
                    </p>
                  )}
                </div>
                <div className="min-w-[200px] flex-1">
                  {editable ? (
                    <Entrada
                      data-testid={`dialogo-texto-${indice + 1}-${i}`}
                      value={d.texto}
                      onChange={(e) =>
                        set(
                          "dialogos",
                          datos.dialogos.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x))
                        )
                      }
                    />
                  ) : (
                    <span className="text-[16px] leading-[24px] text-tinta">{d.texto}</span>
                  )}
                </div>
                {editable && (
                  <button
                    data-testid={`quitar-dialogo-${indice + 1}-${i}`}
                    aria-label="Quitar diálogo"
                    onClick={() => set("dialogos", datos.dialogos.filter((_, j) => j !== i))}
                    className="flex h-9 w-9 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                  >
                    <X size={16} strokeWidth={1.9} />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <Boton
                pequeno
                variante="secundario"
                data-testid={`anadir-dialogo-${indice + 1}`}
                onClick={() => set("dialogos", [...datos.dialogos, { hablante: "narrador", texto: "" }])}
              >
                <Plus size={15} strokeWidth={1.9} /> Añadir diálogo
              </Boton>
            )}
          </div>
        </Campo>
      </div>

      <div className="mt-5 max-w-[240px]">
        <Campo etiqueta="Duración orientativa (s)" ayuda="Solo para orientar; no es un corte.">
          {editable ? (
            <Entrada
              type="number"
              min="0"
              data-testid={`escena-duracion-${indice + 1}`}
              value={datos.duracion_orientativa_s}
              onChange={(e) => set("duracion_orientativa_s", e.target.value)}
            />
          ) : (
            <p className="text-[16px] leading-[24px] text-tinta">
              {datos.duracion_orientativa_s === "" ? "— sin indicar —" : `${datos.duracion_orientativa_s} s`}
            </p>
          )}
        </Campo>
      </div>
    </li>
  );
}
