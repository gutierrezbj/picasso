import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, Star, X } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import { api } from "../api/cliente";
import { costeEstimado } from "../componentes/motor/comun";
import { formatoMoneda } from "../lib/formato";
import type { ModeloCatalogo } from "../tipos";

const FORMATOS = ["9:16", "16:9", "1:1", "4:5"];
const COLOR_NIVEL: Record<string, string> = { verde: "#3f6b4f", ambar: "#c48a1a", rojo: "#b42318" };
const USO: Record<string, string> = { personaje: "identidad", producto: "producto", objeto: "objeto", escenario: "lugar" };
const AYUDA_PARTE: Record<string, string> = {
  sujeto: " Quién o qué sale, con detalle: ",
  entorno: " Dónde está: ",
  cámara: " Cámara: plano y ángulo, ",
  luz: " Luz: de dónde viene y cómo es, ",
  estilo: " Estilo: foto realista de ",
};
const EN_MARCHA = ["autorizada", "enviada", "en_curso"];

interface Referencia {
  medio_id: string;
  nombre: string;
  clase: string | null;
  rol: string;
  persona_real: boolean;
}

function resaltar(antes: string, despues: string): React.ReactNode[] {
  const vistas = new Set(antes.toLowerCase().split(/\s+/).filter(Boolean));
  return despues.split(/(\s+)/).map((p, i) =>
    p.trim() && !vistas.has(p.toLowerCase()) ? (
      <span key={i} className="bg-acentoSuave">
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

function useRetardado<T>(valor: T, ms: number): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}

function Paso({ n, titulo, extra, children }: { n: number; titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-acento text-[12px] font-bold text-white">{n}</span>
        <h2 className="text-[15px] font-bold text-tinta">{titulo}</h2>
        {extra && <span className="ml-auto text-[12px] text-tinta2">{extra}</span>}
      </div>
      {children}
    </section>
  );
}

export default function Taller() {
  const { espacioId = "" } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["taller", espacioId], queryFn: () => api.taller(espacioId) });
  const { data: catalogo } = useQuery({ queryKey: ["catalogo"], queryFn: () => api.catalogo() });

  const [carpetaId, setCarpetaId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [texto, setTexto] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [relacion, setRelacion] = useState("9:16");
  const [cuantas, setCuantas] = useState(1);
  const [mejora, setMejora] = useState<{ antes: string; cambios: any[]; coste: number } | null>(null);
  const [editando, setEditando] = useState(true);
  const [verPorque, setVerPorque] = useState(false);
  const [mejorando, setMejorando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elegirRef, setElegirRef] = useState(false);
  const [nuevaCarpeta, setNuevaCarpeta] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const areaTexto = useRef<HTMLTextAreaElement>(null);
  const [alFinal, setAlFinal] = useState(false);

  const carpetas: any[] = data?.carpetas || [];
  const carpeta = carpetas.find((c) => c.id === carpetaId) || carpetas[0] || null;
  const disponibles: Referencia[] = data?.referencias || [];
  const elegidas = refs.map((id) => disponibles.find((r) => r.medio_id === id)).filter(Boolean) as Referencia[];

  const modelos: ModeloCatalogo[] = (catalogo || []).filter(
    (m) => !m.plantilla && (m.acciones.includes("generar_imagen") || m.acciones.includes("imagen_con_referencias"))
  );
  const modelo =
    modelos.find((m) => m.id === modeloId) ||
    modelos.find((m) => m.elegible && !m.precio_simulado) ||
    modelos.find((m) => m.elegible) ||
    null;
  const maxRefs = modelo?.admite.referencias || 0;
  const precio = costeEstimado(modelo, { variantes: cuantas });

  useEffect(() => {
    document.title = "Taller · Picasso";
  }, []);

  const { data: vista } = useQuery({
    queryKey: ["tomas-carpeta", carpeta?.id],
    queryFn: () => api.tomasCarpeta(carpeta.id),
    enabled: !!carpeta,
    refetchInterval: (q) =>
      ((q.state.data as any)?.en_marcha || []).some((o: any) => EN_MARCHA.includes(o.estado)) ? 2000 : false,
  });
  const tomas: any[] = vista?.tomas || [];
  const enMarcha: any[] = (vista?.en_marcha || []).filter((o: any) => EN_MARCHA.includes(o.estado));
  const avisos: any[] = (vista?.en_marcha || []).filter((o: any) => ["incierta", "fallida"].includes(o.estado));
  const iAbierta = tomas.findIndex((t) => t.id === abierta);
  const toma = iAbierta >= 0 ? tomas[iAbierta] : null;

  useEffect(() => {
    if (iAbierta < 0) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowLeft" && iAbierta > 0) setAbierta(tomas[iAbierta - 1].id);
      if (e.key === "ArrowRight" && iAbierta < tomas.length - 1) setAbierta(tomas[iAbierta + 1].id);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [iAbierta, tomas]);

  const textoRetardado = useRetardado(texto, 600);
  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes", espacioId, textoRetardado, refs.join(",")],
    queryFn: () => api.ingredientesTaller(espacioId, { texto: textoRetardado, referencias: refs.map((m) => ({ medio_id: m })) }),
    enabled: !!textoRetardado.trim() || refs.length > 0,
  });
  const lista: any[] = ingredientes?.ingredientes || [];
  const delPrompt = lista.find((i) => i.nombre === "Prompt");
  const faltan: string[] = textoRetardado.trim() ? delPrompt?.faltan || [] : [];

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["tomas-carpeta", carpeta?.id] });
    await qc.invalidateQueries({ queryKey: ["taller", espacioId] });
  };

  const completar = (parte: string) => {
    setMejora(null);
    setEditando(true);
    const nuevo = texto.trimEnd() + (texto.trim() && !/[.!?]$/.test(texto.trimEnd()) ? "." : "") + (AYUDA_PARTE[parte] || " ");
    setTexto(nuevo);
    setAlFinal(true);
  };

  useEffect(() => {
    const el = areaTexto.current;
    if (!alFinal || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    setAlFinal(false);
  }, [alFinal, texto]);

  const mejorar = async () => {
    setError(null);
    setMejorando(true);
    try {
      const r = await api.mejorarTaller(espacioId, { texto, referencias: refs.map((m) => ({ medio_id: m })), relacion });
      setMejora({ antes: texto, cambios: r.cambios || [], coste: r.coste });
      setTexto(r.texto);
      setEditando(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido mejorar.");
    } finally {
      setMejorando(false);
    }
  };

  const generar = async (cuerpo?: Record<string, unknown>) => {
    if (!carpeta) return;
    setError(null);
    setGenerando(true);
    try {
      await api.generarTaller(
        espacioId,
        cuerpo || {
          carpeta_id: carpeta.id,
          modelo: modelo?.id,
          texto,
          referencias: refs.map((m) => ({ medio_id: m })),
          relacion,
          cuantas,
        }
      );
      await refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido generar.");
    } finally {
      setGenerando(false);
    }
  };

  const valorar = async (valoracion: string) => {
    if (!toma) return;
    await api.valorarToma(toma.id, { valoracion: toma.valoracion === valoracion ? "ninguna" : valoracion });
    await refrescar();
  };

  const reutilizar = (t: any) => {
    setTexto(t.texto || "");
    setRefs((t.referencias || []).filter((id: string) => disponibles.some((r) => r.medio_id === id)));
    if (t.modelo) setModeloId(t.modelo);
    if (t.relacion) setRelacion(t.relacion);
    setMejora(null);
    setEditando(true);
    setAbierta(null);
  };

  const modeloDeToma = (t: any) => modelos.find((m) => m.id === t?.modelo) || null;
  const precioUna = (t: any) => costeEstimado(modeloDeToma(t), { variantes: 1 });

  const fotoDeRefs = lista.filter((i) => i.nombre !== "Prompt");
  const nivelFotos = fotoDeRefs.some((i) => i.nivel === "rojo") ? "rojo" : fotoDeRefs.some((i) => i.nivel === "ambar") ? "ambar" : "verde";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Cabecera
        migas={[
          { texto: "Estudio", a: "/" },
          { texto: data?.espacio?.nombre || "…", a: `/e/${espacioId}` },
          { texto: "Taller" },
        ]}
      />
      <div className="flex min-h-0 flex-1 gap-4 p-4" data-testid="taller">
        <aside className="flex w-[420px] shrink-0 flex-col gap-5 overflow-auto rounded-panel bg-superficie p-5 shadow-card">
          <Paso n={1} titulo="¿Con quién o con qué?" extra={maxRefs ? `${elegidas.length} / ${maxRefs}` : undefined}>
            <div className="flex flex-wrap gap-2">
              {elegidas.map((r) => (
                <div key={r.medio_id} className="flex w-[84px] flex-col gap-1" data-testid={`ref-${r.nombre}`}>
                  <div className="relative h-[84px] w-[84px] overflow-hidden rounded-card bg-superficie2">
                    <img src={api.urlMedio(r.medio_id)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-[6px] bg-superficie px-1.5 py-0.5 text-[10px] font-bold uppercase text-acento">
                      {r.clase ? USO[r.clase] || r.clase : "estilo"}
                    </span>
                    <button
                      aria-label={`Quitar ${r.nombre}`}
                      onClick={() => setRefs(refs.filter((m) => m !== r.medio_id))}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-superficie/90 text-tinta2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <span className="truncate text-[12px] font-semibold">{r.nombre}</span>
                </div>
              ))}
              {(!maxRefs || elegidas.length < maxRefs) && (
                <button
                  data-testid="taller-anadir-ref"
                  onClick={() => setElegirRef(true)}
                  className="flex h-[84px] w-[84px] flex-col items-center justify-center gap-1 rounded-card border-[1.5px] border-dashed border-tinta3 bg-superficie2 text-[12px] text-tinta2"
                >
                  <Plus size={20} /> Añadir
                </button>
              )}
            </div>
            <p className="text-[12px] leading-[17px] text-tinta2">De tus fichas (personas, productos, lugares) o de la biblioteca. Opcional.</p>
          </Paso>

          <Paso n={2} titulo="Describe la imagen">
            {editando ? (
              <textarea
                ref={areaTexto}
                data-testid="taller-texto"
                aria-label="Describe la imagen"
                placeholder="Quién o qué, dónde, y cómo quieres que se vea."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="h-[120px] resize-none rounded-card border border-linea p-3 text-[15px] leading-[22px] text-tinta outline-none focus:border-acento"
              />
            ) : (
              <button
                data-testid="taller-texto-mejorado"
                onClick={() => setEditando(true)}
                title="Pulsa para editar"
                className="max-h-[220px] min-h-[120px] overflow-auto rounded-card border-2 border-acento p-3 text-left text-[15px] leading-[22px] text-tinta"
              >
                {mejora ? resaltar(mejora.antes, texto) : texto}
              </button>
            )}
            {faltan.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5" data-testid="taller-le-falta">
                <span className="text-[12px] text-tinta2">Le falta:</span>
                {faltan.map((p) => (
                  <button
                    key={p}
                    onClick={() => completar(p)}
                    className="h-7 rounded-full border border-[#c48a1a] bg-superficie px-2.5 text-[12px] text-aviso"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            )}
            <button
              data-testid="taller-mejorar"
              disabled={!texto.trim() || mejorando}
              onClick={mejorar}
              className="flex h-11 items-center justify-center gap-2 rounded-control border-[1.5px] border-acento bg-superficie text-[14px] font-bold text-acento disabled:opacity-40"
            >
              {mejorando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Mejorar mi descripción
            </button>
            {mejora ? (
              <div className="flex items-center gap-3 text-[12px]">
                <span className="text-acentoTinta">Mejorada · lo nuevo, resaltado · {formatoMoneda(mejora.coste, "USD")}</span>
                <button className="ml-auto text-acento underline" onClick={() => { setTexto(mejora.antes); setMejora(null); setEditando(true); }}>
                  Deshacer
                </button>
                <button className="text-acento underline" onClick={() => setVerPorque(true)}>
                  Por qué
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-tinta2">Completa lo que falta sin cambiar tu idea. Te enseña qué añadió.</p>
            )}
          </Paso>

          <Paso n={3} titulo="Forma y cantidad">
            <div className="flex gap-1.5">
              {FORMATOS.map((f) => (
                <button
                  key={f}
                  data-testid={`taller-formato-${f}`}
                  aria-pressed={relacion === f}
                  onClick={() => setRelacion(f)}
                  className={
                    "h-10 flex-1 rounded-control text-[13px] " +
                    (relacion === f ? "border-2 border-acento bg-acentoSuave font-semibold" : "border border-linea bg-superficie")
                  }
                >
                  {f}
                </button>
              ))}
              <div className="flex h-10 items-center rounded-control border border-linea px-1">
                <button aria-label="Menos" className="h-7 w-6 text-tinta2" onClick={() => setCuantas(Math.max(1, cuantas - 1))}>−</button>
                <b className="w-4 text-center text-[13px]" data-testid="taller-cuantas">{cuantas}</b>
                <button aria-label="Más" className="h-7 w-6 text-tinta2" onClick={() => setCuantas(Math.min(4, cuantas + 1))}>+</button>
              </div>
            </div>
          </Paso>

          <div className="mt-auto flex flex-col gap-2">
            {error && <p className="text-[13px] leading-[18px] text-aviso" data-testid="taller-error">{error}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-tinta2" data-testid="taller-ingredientes">
              {fotoDeRefs.length > 0 && (
                <span className="flex items-center gap-1.5" title={fotoDeRefs.map((i) => `${i.nombre}: ${i.motivo}`).join("\n")}>
                  <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NIVEL[nivelFotos] }} />
                  Fotos: {nivelFotos === "verde" ? "buenas" : nivelFotos === "ambar" ? "justas" : "muy pequeñas"}
                </span>
              )}
              {delPrompt && textoRetardado.trim() && (
                <span className="flex items-center gap-1.5" title={delPrompt.motivo}>
                  <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NIVEL[delPrompt.nivel] }} />
                  Descripción: {delPrompt.nivel === "verde" ? "completa" : "mejorable"}
                </span>
              )}
              <label className="ml-auto flex items-center gap-1">
                <span className="sr-only">Modelo</span>
                <select
                  data-testid="taller-modelo"
                  value={modelo?.id || ""}
                  onChange={(e) => setModeloId(e.target.value)}
                  className="max-w-[170px] bg-transparent text-[12px] text-acento underline"
                >
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id} disabled={!m.elegible}>
                      {m.nombre_visible}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              data-testid="taller-generar"
              disabled={!texto.trim() || !modelo?.elegible || generando || !carpeta}
              onClick={() => generar()}
              className="flex h-[52px] items-center justify-center gap-2 rounded-card bg-acento text-[16px] font-bold text-white disabled:opacity-40"
            >
              {generando && <Loader2 size={16} className="animate-spin" />}
              Generar {cuantas} {cuantas === 1 ? "imagen" : "imágenes"} · {precio === null ? "sin precio" : formatoMoneda(precio, "USD")}
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-3 rounded-panel bg-superficie p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-1.5">
            {carpetas.map((c) => (
              <button
                key={c.id}
                data-testid={`carpeta-${c.nombre}`}
                onClick={() => setCarpetaId(c.id)}
                className={
                  "h-[34px] rounded-control px-3.5 text-[13px] " +
                  (carpeta?.id === c.id ? "bg-acento font-semibold text-white" : "border border-linea bg-superficie text-tinta")
                }
              >
                {c.nombre}
              </button>
            ))}
            {nuevaCarpeta === null ? (
              <button onClick={() => setNuevaCarpeta("")} className="h-[34px] rounded-control border border-dashed border-tinta3 px-3 text-[13px] text-tinta2">
                + Carpeta
              </button>
            ) : (
              <form
                className="flex gap-1"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!nuevaCarpeta.trim()) return;
                  const c = await api.crearCarpeta(espacioId, nuevaCarpeta);
                  setNuevaCarpeta(null);
                  await qc.invalidateQueries({ queryKey: ["taller", espacioId] });
                  setCarpetaId(c.id);
                }}
              >
                <input
                  autoFocus
                  aria-label="Nombre de la carpeta"
                  value={nuevaCarpeta}
                  onChange={(e) => setNuevaCarpeta(e.target.value)}
                  className="h-[34px] w-44 rounded-control border border-linea px-2 text-[13px]"
                />
                <button className="h-[34px] rounded-control bg-acento px-3 text-[13px] text-white">Crear</button>
              </form>
            )}
            <span className="ml-auto text-[12px] text-tinta2">
              Gasto del Taller: <b className="text-tinta">{formatoMoneda(data?.gasto?.total || 0, "USD")}</b>
            </span>
          </div>

          {avisos.map((o) => (
            <p key={o.id} className="rounded-control bg-superficie2 px-3 py-2 text-[12px] text-aviso">
              {o.estado === "fallida" ? "Falló: " : "Sin confirmar: "}
              {o.error}{" "}
              <button className="underline" onClick={async () => { await api.marcarVisto(o.id); await refrescar(); }}>
                Entendido
              </button>
            </p>
          ))}

          <div
            className="grid min-h-0 flex-1 auto-rows-[330px] gap-3 overflow-auto"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}
            data-testid="taller-rejilla"
          >
            {enMarcha.flatMap((o) =>
              Array.from({ length: o.n }, (_, i) => (
                <div key={`${o.id}-${i}`} className="flex flex-col items-center justify-center gap-2 rounded-card bg-acentoSuave text-[13px] text-acento">
                  <Loader2 size={20} className="animate-spin" /> Generando…
                </div>
              ))
            )}
            {tomas.map((t) => (
              <button
                key={t.id}
                data-testid={`toma-taller-${t.numero}`}
                aria-label={`Imagen ${t.numero}`}
                onClick={() => setAbierta(t.id)}
                className={"relative overflow-hidden rounded-card bg-superficie2 " + (t.valoracion === "descartada" ? "opacity-50" : "")}
              >
                {t.medio && <img src={api.urlMedio(t.medio.id)} alt={`Imagen ${t.numero}`} className="h-full w-full object-cover" />}
                {t.valoracion === "buena" && (
                  <span className="absolute left-2 top-2 rounded-[8px] bg-superficie px-2 py-0.5 text-[11px] font-bold text-acento">★</span>
                )}
              </button>
            ))}
            {!tomas.length && !enMarcha.length && (
              <p className="col-span-full text-[14px] text-tinta3">Esta carpeta está vacía. Sigue los tres pasos de la izquierda y genera.</p>
            )}
          </div>
          {tomas.length > 0 && <p className="text-[13px] text-tinta2">Pulsa una imagen para verla en grande, elegirla y seguir desde ella.</p>}
        </main>
      </div>

      {toma && (
        <div
          role="dialog"
          aria-label={`Imagen ${toma.numero}`}
          data-testid="taller-imagen-abierta"
          className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/55 p-10"
          onClick={(e) => e.target === e.currentTarget && setAbierta(null)}
        >
          <div className="flex h-full max-h-[820px] w-full max-w-[1200px] overflow-hidden rounded-panel bg-superficie shadow-context">
            <div className="relative flex flex-1 items-center justify-center bg-superficie2 p-4">
              {toma.medio && <img src={api.urlMedio(toma.medio.id)} alt="" className="max-h-full max-w-full rounded-card object-contain" />}
              {iAbierta > 0 && (
                <button aria-label="Anterior" onClick={() => setAbierta(tomas[iAbierta - 1].id)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-superficie">
                  <ChevronLeft size={20} />
                </button>
              )}
              {iAbierta < tomas.length - 1 && (
                <button aria-label="Siguiente" onClick={() => setAbierta(tomas[iAbierta + 1].id)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-superficie">
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-auto p-6">
              <div className="flex items-center">
                <b className="text-[17px]">Imagen {toma.numero}</b>
                <button aria-label="Cerrar" onClick={() => setAbierta(null)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-control bg-superficie2">
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <Boton className="flex-1" data-testid="taller-elegir" onClick={() => valorar("buena")}>
                  <Star size={15} fill={toma.valoracion === "buena" ? "currentColor" : "none"} /> {toma.valoracion === "buena" ? "Elegida" : "Me la quedo"}
                </Boton>
                <Boton className="flex-1" variante="secundario" data-testid="taller-descartar" onClick={() => valorar("descartada")}>
                  {toma.valoracion === "descartada" ? "Recuperar" : "Descartar"}
                </Boton>
              </div>
              <div className="flex flex-col gap-2">
                <b className="text-[13px] text-tinta2">¿Y ahora qué?</b>
                <button
                  data-testid="taller-mas-como-esta"
                  disabled={generando || !modeloDeToma(toma)?.elegible}
                  onClick={async () => {
                    await generar({
                      carpeta_id: carpeta.id,
                      modelo: toma.modelo,
                      texto: toma.texto,
                      referencias: (toma.referencias || []).map((m: string) => ({ medio_id: m })),
                      relacion: toma.relacion,
                      cuantas: 1,
                    });
                    setAbierta(null);
                  }}
                  className="h-11 rounded-control border border-linea bg-superficie px-3.5 text-left text-[14px] disabled:opacity-40"
                >
                  Más como esta <span className="text-tinta2">· {precioUna(toma) === null ? "sin precio" : formatoMoneda(precioUna(toma)!, "USD")}</span>
                </button>
                {["Cambiar algo", "¿Por qué salió así?", "Llevarla a vídeo o a un proyecto"].map((p) => (
                  <button key={p} disabled title="Próximamente" className="h-11 rounded-control border border-linea bg-superficie px-3.5 text-left text-[14px] text-tinta3">
                    {p} <span className="text-[12px]">· próximamente</span>
                  </button>
                ))}
              </div>
              <textarea
                key={toma.id}
                aria-label="Nota"
                placeholder="Nota: qué funcionó o qué falla"
                defaultValue={toma.nota || ""}
                onBlur={async (e) => {
                  if (e.target.value !== (toma.nota || "")) {
                    await api.valorarToma(toma.id, { nota: e.target.value });
                    await refrescar();
                  }
                }}
                className="mt-auto h-16 resize-none rounded-control border border-linea p-2 text-[13px] outline-none focus:border-acento"
              />
              <details className="text-[13px] text-tinta2">
                <summary className="cursor-pointer text-acento">Cómo se hizo</summary>
                <p className="mt-2 leading-[19px]">
                  {modeloDeToma(toma)?.nombre_visible || toma.modelo} · {toma.relacion} ·{" "}
                  {toma.coste !== null && toma.coste !== undefined ? formatoMoneda(toma.coste, "USD") : ""} ·{" "}
                  {new Date(toma.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-[19px]">{toma.prompt_enviado}</p>
                <div className="mt-2 flex gap-3">
                  <button className="text-acento underline" onClick={() => navigator.clipboard?.writeText(toma.prompt_enviado || "")}>
                    copiar
                  </button>
                  <button className="text-acento underline" onClick={() => reutilizar(toma)}>
                    reutilizar
                  </button>
                </div>
              </details>
            </aside>
          </div>
        </div>
      )}

      <Dialogo abierto={elegirRef} onCerrar={() => setElegirRef(false)} titulo="¿Con quién o con qué?" ancho="max-w-[720px]">
        {disponibles.length === 0 ? (
          <p className="text-[14px] text-tinta2">No hay fichas validadas con foto ni imágenes en la biblioteca de este espacio.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {disponibles.map((r) => {
              const puesta = refs.includes(r.medio_id);
              const lleno = !puesta && maxRefs > 0 && refs.length >= maxRefs;
              return (
                <button
                  key={r.medio_id}
                  data-testid={`elegir-ref-${r.nombre}`}
                  disabled={lleno}
                  onClick={() => setRefs(puesta ? refs.filter((m) => m !== r.medio_id) : [...refs, r.medio_id])}
                  className={"flex flex-col gap-1 rounded-control p-1 text-left disabled:opacity-40 " + (puesta ? "outline outline-2 outline-acento" : "")}
                >
                  <img src={api.urlMedio(r.medio_id)} alt="" className="h-28 w-full rounded-control object-cover" />
                  <span className="truncate text-[12px] font-semibold">{r.nombre}</span>
                  <span className="text-[11px] text-tinta2">
                    {r.clase ? `${USO[r.clase] || r.clase}${r.persona_real ? " · persona real" : ""}` : "biblioteca · estilo"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Boton onClick={() => setElegirRef(false)}>Listo</Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={verPorque} onCerrar={() => setVerPorque(false)} titulo="Qué cambió y por qué">
        <ul className="flex flex-col gap-2 text-[14px] leading-[20px]">
          {(mejora?.cambios || []).map((c: any, i: number) => (
            <li key={i}><b>{c.parte}.</b> {c.motivo}</li>
          ))}
          {!mejora?.cambios?.length && <li className="text-tinta2">El asistente no explicó los cambios.</li>}
        </ul>
        {mejora && (
          <div className="mt-4 rounded-control bg-superficie2 p-3 text-[13px] leading-[19px]">
            <b>Lo que escribiste:</b> {mejora.antes}
          </div>
        )}
      </Dialogo>
    </div>
  );
}
