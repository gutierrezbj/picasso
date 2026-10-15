import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Star, X } from "lucide-react";
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
  const [tomaId, setTomaId] = useState<string | null>(null);
  const [nota, setNota] = useState("");

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
  const precio = costeEstimado(modelo, { variantes: cuantas });

  useEffect(() => {
    document.title = "Taller · Picasso";
  }, []);

  const { data: vista } = useQuery({
    queryKey: ["tomas-carpeta", carpeta?.id],
    queryFn: () => api.tomasCarpeta(carpeta.id),
    enabled: !!carpeta,
    refetchInterval: (q) =>
      ((q.state.data as any)?.en_marcha || []).some((o: any) => ["autorizada", "enviada", "en_curso"].includes(o.estado))
        ? 2000
        : false,
  });
  const tomas: any[] = vista?.tomas || [];
  const enMarcha: any[] = (vista?.en_marcha || []).filter((o: any) =>
    ["autorizada", "enviada", "en_curso"].includes(o.estado)
  );
  const avisos: any[] = (vista?.en_marcha || []).filter((o: any) => ["incierta", "fallida"].includes(o.estado));
  const toma = tomas.find((t) => t.id === tomaId) || null;

  useEffect(() => {
    setNota(toma?.nota || "");
  }, [toma?.id]);

  const textoRetardado = useRetardado(texto, 600);
  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes", espacioId, textoRetardado, refs.join(",")],
    queryFn: () => api.ingredientesTaller(espacioId, { texto: textoRetardado, referencias: refs.map((m) => ({ medio_id: m })) }),
    enabled: !!textoRetardado.trim() || refs.length > 0,
  });

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["tomas-carpeta", carpeta?.id] });
    await qc.invalidateQueries({ queryKey: ["taller", espacioId] });
  };

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

  const generar = async () => {
    if (!modelo || !carpeta) return;
    setError(null);
    setGenerando(true);
    try {
      await api.generarTaller(espacioId, {
        carpeta_id: carpeta.id,
        modelo: modelo.id,
        texto,
        referencias: refs.map((m) => ({ medio_id: m })),
        relacion,
        cuantas,
      });
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

  const usarArriba = (t: any) => {
    setTexto(t.texto || "");
    setRefs((t.referencias || []).filter((id: string) => disponibles.some((r) => r.medio_id === id)));
    if (t.modelo) setModeloId(t.modelo);
    if (t.relacion) setRelacion(t.relacion);
    setMejora(null);
    setEditando(true);
  };

  const proximamente = ["Cambiar ángulo", "Editar zona", "Ampliar lados", "Pasar a vídeo", "Hacer que hable", "¿Por qué salió así?", "Subir resolución"];

  const tarjeta = "rounded-panel bg-superficie shadow-card";
  const chip = "inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-[12px] leading-[16px]";

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
        <section className={`${tarjeta} flex w-[400px] shrink-0 flex-col gap-3 p-4`}>
          <label className="sr-only" htmlFor="taller-modelo">Modelo</label>
          <select
            id="taller-modelo"
            data-testid="taller-modelo"
            value={modelo?.id || ""}
            onChange={(e) => setModeloId(e.target.value)}
            className="min-h-[44px] rounded-control border border-linea bg-superficie px-3 text-[14px] text-tinta"
          >
            {modelos.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.elegible}>
                {m.nombre_visible} · {m.coste.valor === null ? "sin precio" : `${Number(m.coste.valor).toFixed(2).replace(".", ",")} $`}
              </option>
            ))}
          </select>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border-2 border-acento">
            <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
              {elegidas.map((r) => (
                <span key={r.medio_id} className={`${chip} bg-acentoSuave font-semibold text-acentoTinta`} data-testid={`ref-${r.nombre}`}>
                  <img src={api.urlMedio(r.medio_id)} alt="" className="h-6 w-6 rounded-[7px] object-cover" />
                  @{r.nombre} · {r.clase ? USO[r.clase] || r.clase : "estilo"}
                  <button aria-label={`Quitar ${r.nombre}`} onClick={() => setRefs(refs.filter((m) => m !== r.medio_id))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                data-testid="taller-anadir-ref"
                onClick={() => setElegirRef(true)}
                className={`${chip} border border-dashed border-tinta3 text-tinta2`}
              >
                + @
              </button>
            </div>
            {editando ? (
              <textarea
                data-testid="taller-texto"
                aria-label="Qué quieres"
                placeholder="Qué quieres: quién, dónde, cómo se ve…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="min-h-0 flex-1 resize-none px-3 py-2.5 text-[14px] leading-[21px] text-tinta outline-none"
              />
            ) : (
              <button
                data-testid="taller-texto-mejorado"
                onClick={() => setEditando(true)}
                title="Pulsa para editar"
                className="min-h-0 flex-1 overflow-auto px-3 py-2.5 text-left text-[14px] leading-[21px] text-tinta"
              >
                {mejora ? resaltar(mejora.antes, texto) : texto}
              </button>
            )}
            <div className="flex items-center gap-2 border-t border-linea bg-superficie2 px-2.5 py-2 text-[12px]">
              <button
                data-testid="taller-mejorar"
                disabled={!texto.trim() || mejorando}
                onClick={mejorar}
                className="inline-flex h-[30px] items-center gap-1 rounded-control border border-acento bg-superficie px-2.5 font-semibold text-acento disabled:opacity-40"
              >
                {mejorando ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Mejorar
              </button>
              {mejora && (
                <>
                  <span className="text-acentoTinta">Mejorado · {formatoMoneda(mejora.coste, "USD")}</span>
                  <button className="ml-auto text-acento underline" onClick={() => { setTexto(mejora.antes); setMejora(null); setEditando(true); }}>
                    Deshacer
                  </button>
                  <button className="text-acento underline" onClick={() => setVerPorque(true)}>
                    Por qué
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" data-testid="taller-ingredientes">
            {(ingredientes?.ingredientes || []).map((i: any, n: number) => (
              <span key={n} className={`${chip} bg-superficie2 text-tinta`} title={i.motivo}>
                <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NIVEL[i.nivel] }} />
                {i.nombre}: {i.motivo}
              </span>
            ))}
          </div>

          {error && <p className="text-[13px] leading-[18px] text-aviso" data-testid="taller-error">{error}</p>}

          <div className="flex items-center gap-2">
            <select
              aria-label="Formato"
              value={relacion}
              onChange={(e) => setRelacion(e.target.value)}
              className="h-10 rounded-control border border-linea bg-superficie px-2 text-[13px]"
            >
              {FORMATOS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="flex h-10 items-center rounded-control border border-linea px-1">
              <button aria-label="Menos" className="h-7 w-7 text-tinta2" onClick={() => setCuantas(Math.max(1, cuantas - 1))}>−</button>
              <span className="w-4 text-center text-[13px] font-semibold" data-testid="taller-cuantas">{cuantas}</span>
              <button aria-label="Más" className="h-7 w-7 text-tinta2" onClick={() => setCuantas(Math.min(4, cuantas + 1))}>+</button>
            </div>
            <Boton
              data-testid="taller-generar"
              className="flex-1"
              disabled={!texto.trim() || !modelo?.elegible || generando || !carpeta}
              onClick={generar}
            >
              {generando ? <Loader2 size={15} className="animate-spin" /> : null}
              Generar · {precio === null ? "sin precio" : formatoMoneda(precio, "USD")}
            </Boton>
          </div>
        </section>

        <section className={`${tarjeta} flex min-w-0 flex-1 flex-col gap-3 p-4`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {carpetas.map((c) => (
              <button
                key={c.id}
                data-testid={`carpeta-${c.nombre}`}
                onClick={() => { setCarpetaId(c.id); setTomaId(null); }}
                className={
                  "h-8 rounded-control px-3 text-[12px] " +
                  (carpeta?.id === c.id ? "bg-acento font-semibold text-white" : "border border-linea bg-superficie text-tinta")
                }
              >
                {c.nombre}
              </button>
            ))}
            {nuevaCarpeta === null ? (
              <button onClick={() => setNuevaCarpeta("")} className="h-8 rounded-control border border-dashed border-tinta3 px-2.5 text-[12px] text-tinta2">
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
                  className="h-8 w-40 rounded-control border border-linea px-2 text-[12px]"
                />
                <button className="h-8 rounded-control bg-acento px-2.5 text-[12px] text-white">Crear</button>
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

          <div className="grid min-h-0 flex-1 auto-rows-[236px] grid-cols-3 gap-3 overflow-auto" data-testid="taller-rejilla">
            {enMarcha.flatMap((o) =>
              Array.from({ length: o.n }, (_, i) => (
                <div key={`${o.id}-${i}`} className="flex flex-col items-center justify-center gap-2 rounded-card bg-acentoSuave text-[12px] text-acento">
                  <Loader2 size={20} className="animate-spin" /> Generando…
                </div>
              ))
            )}
            {tomas.map((t) => (
              <button
                key={t.id}
                data-testid={`toma-taller-${t.numero}`}
                onClick={() => setTomaId(t.id)}
                className={
                  "relative overflow-hidden rounded-card bg-superficie2 " +
                  (t.id === tomaId ? "outline outline-[3px] outline-offset-2 outline-acento " : "") +
                  (t.valoracion === "descartada" ? "opacity-50" : "")
                }
              >
                {t.medio && <img src={api.urlMedio(t.medio.id)} alt={`Imagen ${t.numero}`} className="h-full w-full object-cover" />}
                {t.valoracion === "buena" && (
                  <span className="absolute left-2 top-2 rounded-[8px] bg-superficie px-2 py-0.5 text-[11px] font-semibold text-acento">★ Elegida</span>
                )}
              </button>
            ))}
            {!tomas.length && !enMarcha.length && (
              <p className="col-span-3 text-[14px] text-tinta3">Esta carpeta está vacía. Escribe a la izquierda y genera.</p>
            )}
          </div>
        </section>

        <aside className={`${tarjeta} flex w-[340px] shrink-0 flex-col gap-3 overflow-auto p-4`} data-testid="taller-inspector">
          {!toma ? (
            <p className="text-[14px] leading-[20px] text-tinta3">Pulsa una imagen para ver cómo se hizo y seguir desde ella.</p>
          ) : (
            <>
              <div className="flex gap-3">
                {toma.medio && <img src={api.urlMedio(toma.medio.id)} alt="" className="h-[196px] w-[110px] shrink-0 rounded-control object-cover" />}
                <div className="flex flex-col gap-1.5 text-[12px] text-tinta2">
                  <b className="text-[14px] text-tinta">Imagen {toma.numero}</b>
                  <span>{toma.modelo} · {toma.relacion}</span>
                  <span>{toma.coste !== null && toma.coste !== undefined ? formatoMoneda(toma.coste, "USD") : ""} · {new Date(toma.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
                  <div className="mt-auto flex gap-1.5">
                    <Boton pequeno data-testid="taller-elegir" onClick={() => valorar("buena")}>
                      <Star size={13} /> {toma.valoracion === "buena" ? "Elegida" : "Elegir"}
                    </Boton>
                    <Boton pequeno variante="secundario" data-testid="taller-descartar" onClick={() => valorar("descartada")}>
                      {toma.valoracion === "descartada" ? "Recuperar" : "Descartar"}
                    </Boton>
                  </div>
                </div>
              </div>
              <div className="rounded-control bg-superficie2 p-2.5 text-[12px] leading-[18px] whitespace-pre-wrap">
                {toma.prompt_enviado}
              </div>
              <button className="self-start text-[12px] text-acento underline" onClick={() => usarArriba(toma)}>
                Usar este prompt arriba
              </button>
              <input
                aria-label="Nota"
                placeholder="Nota: qué funcionó o qué falla"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onBlur={async () => { if (nota !== (toma.nota || "")) { await api.valorarToma(toma.id, { nota }); await refrescar(); } }}
                className="h-[38px] rounded-control border border-linea px-2.5 text-[13px]"
              />
              <span className="text-[12px] font-semibold text-tinta2">Seguir desde aquí</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  className="h-9 rounded-control border border-linea bg-superficie text-[12px]"
                  onClick={() => { usarArriba(toma); }}
                >
                  Variaciones
                </button>
                {proximamente.map((p) => (
                  <button key={p} disabled title="Próximamente" className="h-9 rounded-control border border-linea bg-superficie text-[12px] text-tinta3">
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-auto grid grid-cols-2 gap-1.5">
                <button disabled title="Próximamente" className="h-[38px] rounded-control bg-acentoSuave text-[12px] font-semibold text-acentoTinta opacity-60">Usar en una ficha</button>
                <button disabled title="Próximamente" className="h-[38px] rounded-control bg-acentoSuave text-[12px] font-semibold text-acentoTinta opacity-60">Llevar a un plano</button>
              </div>
            </>
          )}
        </aside>
      </div>

      <Dialogo abierto={elegirRef} onCerrar={() => setElegirRef(false)} titulo="Añadir referencia" ancho="max-w-[720px]">
        {disponibles.length === 0 ? (
          <p className="text-[14px] text-tinta2">No hay fichas validadas con foto ni imágenes en la biblioteca de este espacio.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {disponibles.map((r) => {
              const puesta = refs.includes(r.medio_id);
              return (
                <button
                  key={r.medio_id}
                  data-testid={`elegir-ref-${r.nombre}`}
                  onClick={() => setRefs(puesta ? refs.filter((m) => m !== r.medio_id) : [...refs, r.medio_id])}
                  className={"flex flex-col gap-1 rounded-control p-1 text-left " + (puesta ? "outline outline-2 outline-acento" : "")}
                >
                  <img src={api.urlMedio(r.medio_id)} alt="" className="h-28 w-full rounded-control object-cover" />
                  <span className="truncate text-[12px] font-semibold">@{r.nombre}</span>
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
