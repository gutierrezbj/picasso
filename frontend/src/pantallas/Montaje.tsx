import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Pause, Play, Trash2 } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import BarraRecorrido from "../componentes/BarraRecorrido";
import Boton from "../componentes/Boton";
import Selector from "../componentes/Selector";
import SubidorMedios from "../componentes/SubidorMedios";
import PanelExportar from "../componentes/PanelExportar";
import { Campo, Entrada } from "../componentes/Campo";
import { useProyecto, usePiezas } from "../api/hooks";
import { api } from "../api/cliente";
import { resumenProyecto } from "../lib/formato";
import type { PistaAudio, PlanoMontaje, VistaMontaje } from "../tipos";

// Pantalla de montaje (P8, §11.2). La línea de tiempo se deriva de lo decidido
// en el guion y el lienzo: aquí se revisa, se escucha y se colocan música y
// ambiente. El corte fino se hace en el editor.

const seg = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${String(Math.round(n * 10) / 10).replace(".", ",")} s`;

const FPS = [
  { valor: "25", texto: "25 fps · Europa" },
  { valor: "24", texto: "24 fps · cine" },
  { valor: "30", texto: "30 fps · América" },
];

export default function Montaje() {
  const { proyectoId, piezaId } = useParams();
  const navegar = useNavigate();
  const { data, refetch: refetchProyecto } = useProyecto(proyectoId);
  const { data: piezas } = usePiezas(proyectoId);
  const aprobadas = (piezas || []).filter((p) => p.guion_estado === "aprobado");
  const pieza = piezaId ? aprobadas.find((p) => p.id === piezaId) : aprobadas[0];

  const { data: vista, refetch, error } = useQuery({
    queryKey: ["montaje", pieza?.id],
    queryFn: () => api.montaje(pieza!.id),
    enabled: !!pieza,
  });

  useEffect(() => {
    if (!data?.proyecto) return;
    const ruta = piezaId ? `/p/${proyectoId}/montaje/${piezaId}` : `/p/${proyectoId}/montaje`;
    api.guardarUbicacion(proyectoId!, ruta).catch(() => {});
    document.title = `Montaje · ${data.proyecto.nombre} · Picasso`;
    // eslint-disable-next-line
  }, [data?.proyecto?.id, piezaId]);

  if (!data) {
    return (
      <div>
        <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "…" }]} />
        <p className="p-10 text-tinta2">Cargando…</p>
      </div>
    );
  }
  const { proyecto, espacio, recorrido, gasto, moneda } = data;
  const migas = [
    { texto: "Estudio", a: "/" },
    { texto: espacio?.nombre || "Espacio", a: `/e/${proyecto.espacio_id}` },
    { texto: proyecto.nombre, a: `/p/${proyectoId}/guion`, insignia: resumenProyecto(proyecto) },
    { texto: "Montaje" },
  ];
  const clave = recorrido.pasos.find((p) => p.pantalla === "montaje")?.clave;

  return (
    <div className="min-h-full">
      <Cabecera migas={migas} gasto={gasto} moneda={moneda} />
      <BarraRecorrido proyectoId={proyectoId} recorrido={recorrido} claveVista={clave} />
      <main className="w-full px-6 py-8 md:px-10" data-testid="montaje">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">Montaje</h1>
            <p className="mt-2 max-w-[68ch] text-[16px] leading-[24px] text-tinta2">
              Las tomas elegidas en el orden del guion, con sus voces, la música y el ambiente. Aquí se
              revisa y se escucha; el corte fino se hace en el editor.
            </p>
          </div>
          {aprobadas.length > 1 && (
            <div className="min-w-[240px]">
              <Campo etiqueta="Capítulo">
                <Selector
                  valor={pieza?.id || ""}
                  onChange={(v) => navegar(`/p/${proyectoId}/montaje/${v}`)}
                  opciones={aprobadas.map((p) => ({
                    valor: p.id,
                    texto: p.titulo || `Capítulo ${p.numero || ""}`,
                  }))}
                />
              </Campo>
            </div>
          )}
        </div>

        {!pieza && (
          <p className="mt-8 text-tinta2" data-testid="montaje-sin-guion">
            El montaje se abre cuando el guion está aprobado y el lienzo tiene planos.
          </p>
        )}
        {error && <p className="mt-8 text-error">{(error as Error).message}</p>}

        {vista && (
          <Contenido
            vista={vista}
            espacioId={proyecto.espacio_id}
            onCambiado={async () => {
              await refetch();
              await refetchProyecto();
            }}
            proyectoId={proyectoId!}
          />
        )}
      </main>
    </div>
  );
}

function Contenido({
  vista,
  espacioId,
  proyectoId,
  onCambiado,
}: {
  vista: VistaMontaje;
  espacioId: string;
  proyectoId: string;
  onCambiado: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const total = Math.max(vista.duracion_total_s, 1);
  // Escala: la pieza entera cabe en ~1100 px, con un mínimo de 40 px por segundo.
  const pxPorSeg = Math.max(40, Math.min(160, 1100 / total));
  const ancho = Math.ceil(total * pxPorSeg) + 24;

  const cambiarFps = async (v: string) => {
    setError(null);
    try {
      await api.editarProyecto(vista.proyecto.id, { fps: Number(v), updated_at: vista.proyecto.updated_at });
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido cambiar.");
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-[220px]">
          <Campo etiqueta="Fotogramas por segundo" ayuda="Todo se exportará a esta cifra.">
            <Selector data-testid="montaje-fps" valor={String(vista.proyecto.fps)} onChange={cambiarFps} opciones={FPS} />
          </Campo>
        </div>
        <p className="text-[16px] text-tinta" data-testid="montaje-duracion">
          Duración: <span className="tabular font-medium">{seg(vista.duracion_total_s)}</span> ·{" "}
          {vista.planos.length} plano(s) · {vista.voces.length} voz(es) · revisión {vista.revision_guion} del guion
        </p>
      </div>
      {error && <p className="text-error">{error}</p>}

      {vista.avisos.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-card bg-superficie p-5" data-testid="montaje-avisos">
          {vista.avisos.map((a) => (
            <li key={a} className="flex items-start gap-2 text-[14px] text-aviso">
              <AlertTriangle size={16} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
              {a}
            </li>
          ))}
        </ul>
      )}

      <Reproductor vista={vista} />

      <div className="overflow-x-auto rounded-card bg-superficie p-4" data-testid="montaje-tira">
        <div className="flex flex-col gap-3" style={{ width: ancho }}>
          <Regla total={total} pxPorSeg={pxPorSeg} />
          <Fila etiqueta="Vídeo" alto={150}>
            {vista.planos.map((p) => (
              <BloquePlano key={p.plano_id} plano={p} px={pxPorSeg} proyectoId={proyectoId} relacion={vista.proyecto.formato_video} />
            ))}
          </Fila>
          <Fila etiqueta="Voces">
            {vista.voces.map((v) => (
              <Bloque
                key={v.dialogo_id}
                izquierda={v.inicio_s * pxPorSeg}
                ancho={(v.duracion_s || 1) * pxPorSeg}
                tono={v.desactualizada ? "aviso" : "acento"}
                titulo={`${v.hablante_nombre}: «${v.texto}»`}
                testid="bloque-voz"
              >
                {v.hablante_nombre} · {seg(v.duracion_s)}
              </Bloque>
            ))}
          </Fila>
          {(["musica", "ambiente"] as const).map((capa) => (
            <Fila key={capa} etiqueta={capa === "musica" ? "Música" : "Ambiente"}>
              {vista.pistas
                .filter((p) => p.capa === capa)
                .map((p) => (
                  <Bloque
                    key={p.id}
                    izquierda={p.inicio_s * pxPorSeg}
                    ancho={Math.min((p.duracion_s || total) , Math.max(total - p.inicio_s, 0.5)) * pxPorSeg}
                    tono="neutro"
                    titulo={`${p.nombre} · ${p.volumen_db} dB`}
                    testid={`bloque-${capa}`}
                  >
                    {p.nombre} · {p.volumen_db} dB
                  </Bloque>
                ))}
            </Fila>
          ))}
        </div>
      </div>

      <PanelPistas vista={vista} espacioId={espacioId} onCambiado={onCambiado} />

      <PanelExportar piezaId={vista.pieza.id} onExportado={onCambiado} />
    </div>
  );
}

function Regla({ total, pxPorSeg }: { total: number; pxPorSeg: number }) {
  const marcas = [];
  const paso = total > 60 ? 10 : total > 20 ? 5 : 1;
  for (let s = 0; s <= total; s += paso) marcas.push(s);
  return (
    <div className="relative ml-[96px] h-5 text-[12px] text-tinta3">
      {marcas.map((s) => (
        <span key={s} className="absolute tabular" style={{ left: s * pxPorSeg }}>
          {s} s
        </span>
      ))}
    </div>
  );
}

function Fila({ etiqueta, alto = 44, children }: { etiqueta: string; alto?: number; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch gap-2">
      <div className="w-[88px] shrink-0 pt-2 text-[13px] font-medium text-tinta2">{etiqueta}</div>
      <div className="relative flex-1 rounded-control bg-superficie2" style={{ minHeight: alto }}>
        {children}
      </div>
    </div>
  );
}

function Bloque({
  izquierda,
  ancho,
  tono,
  titulo,
  testid,
  children,
}: {
  izquierda: number;
  ancho: number;
  tono: "acento" | "aviso" | "neutro";
  titulo: string;
  testid: string;
  children: React.ReactNode;
}) {
  const color =
    tono === "acento" ? "bg-acentoSuave text-acento" : tono === "aviso" ? "bg-superficie text-aviso ring-1 ring-aviso" : "bg-superficie text-tinta2 ring-1 ring-linea";
  return (
    <div
      title={titulo}
      data-testid={testid}
      className={`absolute top-1 bottom-1 overflow-hidden truncate rounded-control px-2 py-1 text-[13px] ${color}`}
      style={{ left: izquierda, width: Math.max(ancho - 2, 24) }}
    >
      {children}
    </div>
  );
}

function BloquePlano({ plano, px, proyectoId, relacion }: { plano: PlanoMontaje; px: number; proyectoId: string; relacion: string }) {
  const hueco = !plano.toma;
  return (
    <div
      data-testid={hueco ? "bloque-hueco" : "bloque-plano"}
      className={
        "absolute top-1 bottom-1 flex flex-col gap-1 overflow-hidden rounded-control p-1 text-[12px] " +
        (hueco ? "border border-dashed border-tinta3 bg-superficie text-tinta2" : "bg-superficie text-tinta ring-1 ring-linea")
      }
      style={{ left: plano.inicio_s * px, width: Math.max(plano.duracion_s * px - 2, 24) }}
      title={plano.descripcion || plano.etiqueta}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded bg-superficie2">
        {plano.toma &&
          (plano.toma.clase === "imagen" ? (
            <img src={api.urlMedio(plano.toma.medio_id)} alt="" className="h-full w-full object-contain" />
          ) : (
            <video src={`${api.urlMedio(plano.toma.medio_id)}#t=0.5`} preload="metadata" muted className="h-full w-full bg-black object-contain" />
          ))}
      </div>
      <span className="truncate font-medium">
        {plano.etiqueta} · {hueco ? "sin toma" : `toma ${plano.toma?.numero}`}
      </span>
      <span className="truncate text-tinta2">{seg(plano.duracion_s)}</span>
      <Link to={`/p/${proyectoId}/lienzo`} className="truncate text-acento underline" data-testid="ir-al-plano">
        Ir al plano
      </Link>
    </div>
  );
}

// Reproduce la secuencia en el navegador, sin render (§11.2): cada toma elegida
// por su duración, los huecos en negro, las voces en su sitio y la música y el
// ambiente desde su inicio.
function Reproductor({ vista }: { vista: VistaMontaje }) {
  const [indice, setIndice] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const temporizadores = useRef<number[]>([]);
  const audios = useRef<HTMLAudioElement[]>([]);
  const plano = indice === null ? null : vista.planos[indice];

  const parar = () => {
    temporizadores.current.forEach((t) => window.clearTimeout(t));
    temporizadores.current = [];
    audios.current.forEach((a) => a.pause());
    audios.current = [];
    video.current?.pause();
    setIndice(null);
  };

  const sonar = (medioId: string, volumenDb = 0) => {
    const a = new Audio(api.urlMedio(medioId));
    a.volume = Math.min(1, Math.pow(10, volumenDb / 20));
    audios.current.push(a);
    a.play().catch(() => {});
  };

  const empezar = () => {
    parar();
    vista.pistas.forEach((p) => {
      temporizadores.current.push(window.setTimeout(() => sonar(p.medio_id, p.volumen_db), p.inicio_s * 1000));
    });
    vista.voces.forEach((v) => {
      temporizadores.current.push(window.setTimeout(() => sonar(v.medio_id), v.inicio_s * 1000));
    });
    vista.planos.forEach((p, i) => {
      temporizadores.current.push(window.setTimeout(() => setIndice(i), p.inicio_s * 1000));
    });
    temporizadores.current.push(window.setTimeout(parar, vista.duracion_total_s * 1000 + 200));
    setIndice(0);
  };

  useEffect(() => {
    if (plano?.toma?.clase === "video" && video.current) {
      video.current.currentTime = 0;
      video.current.play().catch(() => {});
    }
  }, [indice, plano]);

  useEffect(() => parar, []); // eslint-disable-line

  const relacion = vista.proyecto.formato_video.replace(":", "/");
  return (
    <section className="flex flex-col gap-3" data-testid="montaje-reproductor">
      <div className="flex items-center gap-3">
        {indice === null ? (
          <Boton data-testid="reproducir-secuencia" onClick={empezar} disabled={!vista.planos.length}>
            <Play size={16} strokeWidth={2} aria-hidden /> Reproducir secuencia
          </Boton>
        ) : (
          <Boton variante="secundario" onClick={parar}>
            <Pause size={16} strokeWidth={2} aria-hidden /> Parar
          </Boton>
        )}
        {plano && (
          <span className="text-[14px] text-tinta2" data-testid="reproduciendo">
            {plano.etiqueta} · {plano.escena_titulo}
          </span>
        )}
      </div>
      {indice !== null && (
        <div className="w-full max-w-[720px] overflow-hidden rounded-card bg-black" style={{ aspectRatio: relacion }}>
          {plano?.toma?.clase === "video" ? (
            <video ref={video} key={plano.toma.medio_id} src={api.urlMedio(plano.toma.medio_id)} muted className="h-full w-full object-contain" />
          ) : plano?.toma ? (
            <img src={api.urlMedio(plano.toma.medio_id)} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-[16px] text-white/70">
              {plano?.etiqueta} · sin toma
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PanelPistas({
  vista,
  espacioId,
  onCambiado,
}: {
  vista: VistaMontaje;
  espacioId: string;
  onCambiado: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const { data: audios, refetch } = useQuery({
    queryKey: ["medios", espacioId, "audio"],
    queryFn: () => api.medios(espacioId, "audio"),
  });

  const anadir = async (capa: "musica" | "ambiente", medioId: string) => {
    setError(null);
    try {
      await api.anadirPista(vista.pieza.id, { capa, medio_id: medioId });
      await onCambiado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido añadir.");
    }
  };

  return (
    <section className="flex flex-col gap-4" data-testid="montaje-pistas">
      <h2 className="text-[22px] leading-[30px] font-semibold text-tinta">Música y ambiente</h2>
      {(["musica", "ambiente"] as const).map((capa) => (
        <div key={capa} className="flex flex-col gap-3 rounded-card bg-superficie p-5">
          <h3 className="text-[18px] font-semibold text-tinta">{capa === "musica" ? "Música" : "Ambiente"}</h3>
          {vista.pistas
            .filter((p) => p.capa === capa)
            .map((p) => (
              <FilaPista key={p.id} pista={p} onCambiado={onCambiado} />
            ))}
          <div className="flex flex-wrap items-end gap-3">
            {(audios || []).length > 0 && (
              <div className="min-w-[260px]">
                <Campo etiqueta="Añadir desde la biblioteca">
                  <Selector
                    data-testid={`anadir-${capa}`}
                    valor=""
                    onChange={(v) => v && anadir(capa, v)}
                    opciones={[{ valor: "", texto: "Elige un audio…" }].concat(
                      (audios || []).map((m) => ({ valor: m.id, texto: m.nombre_original || m.id }))
                    )}
                  />
                </Campo>
              </div>
            )}
            <SubidorMedios
              espacioId={espacioId}
              acepta="audio/*"
              texto="Subir audio"
              onSubido={async (nuevos) => {
                await refetch();
                if (nuevos[0]) await anadir(capa, nuevos[0].id);
              }}
            />
          </div>
        </div>
      ))}
      {error && <p className="text-error">{error}</p>}
    </section>
  );
}

function FilaPista({ pista, onCambiado }: { pista: PistaAudio; onCambiado: () => Promise<void> }) {
  const [inicio, setInicio] = useState(String(pista.inicio_s));
  const [volumen, setVolumen] = useState(String(pista.volumen_db));
  useEffect(() => {
    setInicio(String(pista.inicio_s));
    setVolumen(String(pista.volumen_db));
  }, [pista.inicio_s, pista.volumen_db]);

  const guardar = async (datos: { inicio_s?: number; volumen_db?: number }) => {
    await api.editarPista(pista.id, datos);
    await onCambiado();
  };

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_140px_140px_auto]" data-testid="fila-pista">
      <div className="min-w-0">
        <p className="truncate text-[16px] text-tinta">{pista.nombre}</p>
        <p className="text-[13px] text-tinta2">{seg(pista.duracion_s)}</p>
        <audio src={api.urlMedio(pista.medio_id)} controls className="mt-1 w-full" />
      </div>
      <Campo etiqueta="Inicio (s)">
        <Entrada
          type="number"
          min={0}
          step={0.1}
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          onBlur={() => Number(inicio) >= 0 && Number(inicio) !== pista.inicio_s && guardar({ inicio_s: Number(inicio) })}
        />
      </Campo>
      <Campo etiqueta="Volumen (dB)">
        <Entrada
          type="number"
          min={-60}
          max={12}
          step={1}
          value={volumen}
          onChange={(e) => setVolumen(e.target.value)}
          onBlur={() => {
            const n = Number(volumen);
            if (n >= -60 && n <= 12 && n !== pista.volumen_db) guardar({ volumen_db: n });
          }}
        />
      </Campo>
      <Boton
        variante="secundario"
        aria-label={`Quitar ${pista.nombre}`}
        onClick={async () => {
          await api.quitarPista(pista.id);
          await onCambiado();
        }}
      >
        <Trash2 size={16} strokeWidth={1.9} aria-hidden /> Quitar
      </Boton>
    </div>
  );
}
