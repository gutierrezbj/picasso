import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import Mesa from "../componentes/mesa/Mesa";
import Lateral, { type Pestana } from "../componentes/mesa/Lateral";
import PanelMejora from "../componentes/mesa/PanelMejora";
import ComparadorTomas from "../componentes/lienzo/ComparadorTomas";
import type { NodoVersionMesa } from "../componentes/mesa/NodoVersion";
import type { AristaMesa } from "../componentes/mesa/AristaInstruccion";
import { api, ErrorApi } from "../api/cliente";
import { costeEstimado, textoGasto } from "../componentes/motor/comun";
import { formatoMoneda, formatoMonedaFino } from "../lib/formato";
import { colocar, type NodoArbol } from "../lib/mesa";
import { trasError } from "../lib/peticiones";
import type { ModeloCatalogo } from "../tipos";

const COLOR_NIVEL: Record<string, string> = { verde: "#81B88B", ambar: "#F5A623", rojo: "#E57373" };
const USO: Record<string, string> = { personaje: "identidad", producto: "producto", objeto: "objeto", escenario: "lugar" };
const AYUDA_PARTE: Record<string, string> = {
  sujeto: " Quién o qué sale, con detalle: ",
  entorno: " Dónde está: ",
  cámara: " Cámara: plano y ángulo, ",
  luz: " Luz: de dónde viene y cómo es, ",
  estilo: " Estilo: foto realista de ",
};
const EN_MARCHA = ["autorizada", "enviada", "en_curso"];
const DIRECCION: { clave: string; nombre: string; opciones: string[] }[] = [
  { clave: "encuadre", nombre: "Encuadre", opciones: ["Primer plano", "Plano medio", "Plano general"] },
  { clave: "angulo", nombre: "Ángulo", opciones: ["A los ojos", "Picado", "Contrapicado"] },
  { clave: "luz", nombre: "Luz", opciones: ["Natural de ventana", "Contraluz", "Suave de estudio", "Nocturna"] },
  { clave: "optica", nombre: "Óptica", opciones: ["35 mm", "50 mm", "85 mm"] },
];
const ZONAS = [
  ["cabeza", "Cabeza"],
  ["ropa", "Ropa"],
  ["fondo", "Fondo"],
  ["luz", "Luz"],
  ["libre", "Libre"],
];

interface Pendiente {
  id: string;
  tipo: "generar" | "ajustar";
  tomaId?: string;
  cuerpo: Record<string, unknown>;
  texto: string;
  precio: string;
  noLlego?: boolean;
  deBarra?: boolean;
}

const esPresupuesto = (e: unknown) => e instanceof ErrorApi && e.status === 409 && /presupuesto/i.test(e.message);

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

const precioTexto = (p: number | null) => (p === null ? "sin precio" : formatoMoneda(p, "USD"));

async function conReconexion<T>(llamar: () => Promise<T>): Promise<T> {
  try {
    return await llamar();
  } catch (e) {
    if (e instanceof ErrorApi) throw e;
    await new Promise((r) => setTimeout(r, 1000));
    return await llamar();
  }
}

function Pastilla({ activa, children, ...resto }: { activa: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...resto}
      aria-pressed={activa}
      className={
        "h-7 rounded-[8px] px-2.5 text-[12px] " +
        (activa ? "border-[1.5px] border-acento bg-acento font-bold text-sobreAcento" : "border border-linea bg-superficie2 text-tinta")
      }
    >
      {children}
    </button>
  );
}

export default function Taller() {
  const { espacioId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["taller", espacioId], queryFn: () => api.taller(espacioId) });
  const claveCarpeta = `picasso.taller.${espacioId}.carpeta`;

  const [modeloId, setModeloId] = useState("");
  const [texto, setTexto] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [relacion, setRelacion] = useState("9:16");
  const [cuantas, setCuantas] = useState(1);
  const [direccion, setDireccion] = useState<Record<string, string>>({});
  const [zona, setZona] = useState<string | null>(null);
  const [dirAbierta, setDirAbierta] = useState(false);
  const [mejora, setMejora] = useState<{ antes: string; cambios: any[]; coste: number | null } | null>(null);
  const [editandoTexto, setEditandoTexto] = useState(true);
  const [verPorque, setVerPorque] = useState(false);
  const [mejorando, setMejorando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elegirRef, setElegirRef] = useState(false);
  const [nuevaCarpeta, setNuevaCarpeta] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana | null>(null);
  const [comparar, setComparar] = useState(false);
  const [esperando, setEsperando] = useState<string | null>(null);
  const [reintento, setReintento] = useState<any | null>(null);
  const [marcarFallida, setMarcarFallida] = useState<any | null>(null);
  const [confirmarPresupuesto, setConfirmarPresupuesto] = useState<{ mensaje: string; seguir: () => Promise<unknown> } | null>(null);
  const [borrador, setBorradorEstado] = useState<any | null>(null);
  const borradorRef = useRef<any | null>(null);
  const textoRef = useRef("");
  const alcanceRef = useRef<Record<string, unknown>>({ tipo: "nueva" });
  const [guardando, setGuardando] = useState(false);
  const [conflictoBorrador, setConflictoBorrador] = useState<any | null>(null);
  const [verMejoras, setVerMejoras] = useState(true);
  const [reintentosMejora, setReintentosMejora] = useState<Record<string, any>>({});
  const [ocupadoMejora, setOcupadoMejora] = useState(false);
  const [confirmarTarifa, setConfirmarTarifa] = useState<any | null>(null);
  const [confirmarAnterior, setConfirmarAnterior] = useState<{ m: any; usarCopia: boolean } | null>(null);
  const areaTexto = useRef<HTMLTextAreaElement>(null);
  const [alFinal, setAlFinal] = useState(false);
  const clavePendiente = `picasso.taller.${espacioId}.pendiente`;
  const [pendiente, setPendienteEstado] = useState<Pendiente | null>(() => {
    try {
      const crudo = localStorage.getItem(`picasso.taller.${espacioId}.pendiente`);
      return crudo ? (JSON.parse(crudo) as Pendiente) : null;
    } catch {
      return null;
    }
  });
  const guardarPendiente = (p: Pendiente | null) => {
    setPendienteEstado(p);
    try {
      if (p) localStorage.setItem(clavePendiente, JSON.stringify(p));
      else localStorage.removeItem(clavePendiente);
    } catch {
      /* sin almacenamiento local: la petición pendiente vive solo en esta pestaña */
    }
  };

  const carpetas: any[] = data?.carpetas || [];
  const guardada = (() => {
    try {
      return localStorage.getItem(claveCarpeta);
    } catch {
      return null;
    }
  })();
  const pedida = params.get("carpeta") || guardada;
  const carpeta = carpetas.find((c) => c.id === pedida) || carpetas[0] || null;
  const elegirCarpeta = (id: string) => {
    setParams({ carpeta: id }, { replace: true });
    try {
      localStorage.setItem(claveCarpeta, id);
    } catch {
      /* sin almacenamiento local */
    }
    setSeleccion(null);
    setPestana(null);
  };

  const disponibles: Referencia[] = data?.referencias || [];
  const nombresRef = useMemo(() => Object.fromEntries(disponibles.map((r) => [r.medio_id, r.nombre])), [disponibles]);
  const elegidas = refs.map((id) => disponibles.find((r) => r.medio_id === id)).filter(Boolean) as Referencia[];
  const todos: ModeloCatalogo[] = data?.modelos || [];
  const modelos = todos.filter((m) => m.acciones.includes("generar_imagen") || m.acciones.includes("imagen_con_referencias"));
  const modelo =
    modelos.find((m) => m.id === modeloId) ||
    modelos.find((m) => m.elegible && m.coste.verificado) ||
    modelos.find((m) => m.elegible) ||
    null;
  const porId = (id: string | null | undefined) => todos.find((m) => m.id === id) || null;
  const limite = modelo?.limite_lote || 1;
  const maxRefs = modelo?.admite.referencias || 0;

  useEffect(() => {
    document.title = "Taller · Picasso";
  }, []);
  useEffect(() => {
    if (cuantas > limite) setCuantas(limite);
  }, [limite, cuantas]);
  useEffect(() => {
    if (modelo && modelo.relaciones.length && !modelo.relaciones.includes(relacion)) setRelacion(modelo.relaciones[0]);
  }, [modelo, relacion]);

  const { data: vista } = useQuery({
    queryKey: ["tomas-carpeta", carpeta?.id],
    queryFn: () => api.tomasCarpeta(carpeta.id),
    enabled: !!carpeta,
    refetchInterval: (q) => (((q.state.data as any)?.en_marcha || []).some((o: any) => EN_MARCHA.includes(o.estado)) ? 1500 : 10000),
  });
  const tomas: any[] = vista?.tomas || [];
  const abiertas: any[] = vista?.en_marcha || [];
  const firmaVista = abiertas.map((o) => o.id + o.estado).join("|") + "|" + tomas.length;
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["taller", espacioId] });
  }, [firmaVista, qc, espacioId]);

  useEffect(() => {
    if (!esperando) return;
    const nueva = tomas.find((t) => t.operacion_id === esperando);
    if (nueva) {
      setSeleccion(nueva.id);
      setEsperando(null);
    } else if (!abiertas.some((o) => o.id === esperando && EN_MARCHA.includes(o.estado))) {
      if (abiertas.some((o) => o.id === esperando)) setEsperando(null);
    }
  }, [esperando, tomas, abiertas]);

  const sel = tomas.find((t) => t.id === seleccion) || null;
  const editando = !!sel && sel.medio?.clase === "imagen";
  const modeloEdicion = editando ? porId(sel.modelo_edicion) : null;
  const precio = editando ? costeEstimado(modeloEdicion, { variantes: 1 }) : costeEstimado(modelo, { variantes: cuantas });
  const alcanceBorrador: Record<string, unknown> = editando ? { tipo: "editar", toma_id: sel.id } : { tipo: "nueva" };
  const claveAlcance = JSON.stringify(alcanceBorrador);
  textoRef.current = texto;
  alcanceRef.current = alcanceBorrador;
  const setBorrador = (b: any | null) => {
    borradorRef.current = b;
    setBorradorEstado(b);
    if (b && carpeta) {
      try {
        localStorage.setItem(`picasso.taller.${espacioId}.borrador.${b.carpeta_id}`, b.id);
      } catch {
        /* sin almacenamiento local: se recupera por la carpeta */
      }
    }
  };
  const normalAlcance = (a: any) => `${a?.tipo || "nueva"}:${a?.toma_id || ""}`;
  const mismoAlcance = (b: any, a: Record<string, unknown>) => normalAlcance(b?.alcance) === normalAlcance(a);
  const sinGuardar = !!borrador && (texto !== borrador.texto || !mismoAlcance(borrador, alcanceBorrador));

  useEffect(() => {
    if (!carpeta) return;
    let vivo = true;
    (async () => {
      let b: any = null;
      try {
        const id = localStorage.getItem(`picasso.taller.${espacioId}.borrador.${carpeta.id}`);
        if (id) {
          const x = await api.verBorrador(id);
          if (!x.cerrado_en && x.carpeta_id === carpeta.id) b = x;
        }
      } catch {
        b = null;
      }
      if (!b) {
        try {
          b = await api.borradorAbierto(espacioId, carpeta.id);
        } catch {
          b = await api.crearBorrador(espacioId, { carpeta_id: carpeta.id, texto: "" });
        }
      }
      if (!vivo) return;
      setBorrador(b);
      setConflictoBorrador(null);
      setTexto(b.texto || "");
    })().catch((e) => setError(e instanceof Error ? e.message : "No se ha podido recuperar el borrador."));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpeta?.id, espacioId]);

  const guardarAhora = async (): Promise<any> => {
    const b = borradorRef.current;
    const t = textoRef.current;
    const a = alcanceRef.current;
    if (!b) throw new Error("El borrador aún no está listo.");
    if (t === b.texto && mismoAlcance(b, a)) return b;
    setGuardando(true);
    try {
      const nuevo = await api.guardarBorrador(b.id, { revision: b.revision, texto: t, alcance: a });
      setBorrador(nuevo);
      setConflictoBorrador(null);
      return nuevo;
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409 && e.datos?.motivo === "cerrado") {
        const nb = await api.crearBorrador(espacioId, { carpeta_id: b.carpeta_id, texto: t, alcance: a });
        setBorrador(nb);
        return nb;
      }
      if (e instanceof ErrorApi && e.status === 409) setConflictoBorrador(e.datos?.borrador || null);
      throw e;
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    if (!sinGuardar || conflictoBorrador) return;
    const t = setTimeout(() => {
      guardarAhora().catch((): void => undefined);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, claveAlcance, borrador?.revision, conflictoBorrador]);

  const { data: vistaMejoras, refetch: refetchMejoras } = useQuery({
    queryKey: ["mejoras", borrador?.id],
    queryFn: () => api.mejorasBorrador(borrador.id),
    enabled: !!borrador,
    refetchInterval: (q) => (((q.state.data as any)?.mejoras || []).some((m: any) => EN_MARCHA.includes(m.estado)) ? 1000 : 8000),
  });
  const listaMejoras: any[] = vistaMejoras?.mejoras || [];
  const bloqueoMejora = vistaMejoras?.bloqueo || null;
  const pendientesMejora = listaMejoras.filter((m) => !m.decision);
  const firmaMejoras = listaMejoras.map((m) => `${m.id}:${m.estado}:${m.intentos}:${(m.coste?.cargos || []).map((c: any) => c.estado).join(",")}`).join("|");
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["taller", espacioId] });
  }, [firmaMejoras, qc, espacioId]);
  const alcance = editando ? `Editar V${sel.numero}` : "Nueva imagen";
  const enCurso = abiertas.some((o) => EN_MARCHA.includes(o.estado));

  const textoRetardado = useRetardado(texto, 600);
  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes", espacioId, textoRetardado, refs.join(",")],
    queryFn: () => api.ingredientesTaller(espacioId, { texto: textoRetardado, referencias: refs.map((m) => ({ medio_id: m })) }),
    enabled: !editando && (!!textoRetardado.trim() || refs.length > 0),
  });
  const lista: any[] = ingredientes?.ingredientes || [];
  const delPrompt = lista.find((i) => i.nombre === "Prompt");
  const faltan: string[] = !editando && textoRetardado.trim() ? delPrompt?.faltan || [] : [];

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["mejoras"] });
    await qc.invalidateQueries({ queryKey: ["tomas-carpeta", carpeta?.id] });
    await qc.invalidateQueries({ queryKey: ["taller", espacioId] });
  };

  useEffect(() => {
    const el = areaTexto.current;
    if (!alFinal || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    setAlFinal(false);
  }, [alFinal, texto]);

  const completar = (parte: string) => {
    setMejora(null);
    setEditandoTexto(true);
    setTexto(texto.trimEnd() + (texto.trim() && !/[.!?]$/.test(texto.trimEnd()) ? "." : "") + (AYUDA_PARTE[parte] || " "));
    setAlFinal(true);
  };

  const seleccionar = (id: string) => {
    setSeleccion(id);
    setDirAbierta(false);
    setPestana((p) => (p === "director" ? "director" : "imagen"));
  };
  const nuevaImagen = () => {
    setSeleccion(null);
    setDirAbierta(false);
    setPestana((p) => (p === "imagen" ? null : p));
  };

  const enviar = async (p: Pendiente) => {
    setError(null);
    setEnviando(true);
    guardarPendiente({ ...p, noLlego: false });
    try {
      const r: any = await conReconexion(() =>
        p.tipo === "ajustar" ? api.ajustarToma(p.tomaId as string, p.cuerpo) : api.generarTaller(espacioId, p.cuerpo)
      );
      guardarPendiente(null);
      setEsperando(r.operacion.id);
      const b = borradorRef.current;
      if (p.deBarra && b) {
        try {
          await api.cerrarBorrador(b.id);
          setBorrador(await api.crearBorrador(espacioId, { carpeta_id: b.carpeta_id, texto: "" }));
        } catch {
          setError("La imagen salió, pero no se ha podido empezar un borrador nuevo: recarga la Mesa.");
        }
      }
      setTexto("");
      setMejora(null);
      setEditandoTexto(true);
      setDirAbierta(false);
      setZona(null);
    } catch (e) {
      const status = e instanceof ErrorApi ? e.status : null;
      const decision = trasError(status, e instanceof Error ? e.message : "");
      if (decision === "incierta") {
        setError(
          status
            ? `El servidor respondió con un error (${status}) y no confirma si la recibió. La petición queda pendiente: compruébala antes de repetirla.`
            : "No hubo respuesta del servidor. La petición queda pendiente: compruébala antes de repetirla."
        );
      } else {
        guardarPendiente(null);
        if (decision === "presupuesto")
          setConfirmarPresupuesto({
            mensaje: (e as Error).message,
            seguir: () => enviar({ ...p, cuerpo: { ...p.cuerpo, confirmado_por_encima_del_presupuesto: true } }),
          });
        else setError((e as Error).message);
      }
    } finally {
      setEnviando(false);
      await refrescar();
    }
  };

  const comprobarPendiente = async (p: Pendiente) => {
    try {
      const r: any = await api.peticionTaller(espacioId, p.id);
      guardarPendiente(null);
      setEsperando(r.operacion.id);
      await refrescar();
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 404) guardarPendiente({ ...p, noLlego: true });
      else setError("Sigue sin haber respuesta del servidor. Vuelve a comprobarlo en un momento.");
    }
  };

  useEffect(() => {
    if (pendiente && !enviando) void comprobarPendiente(pendiente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accion = async () => {
    if (!carpeta || !texto.trim() || enviando || pendiente || precio === null) return;
    const id = crypto.randomUUID();
    await enviar(
      editando
        ? {
            id,
            tipo: "ajustar",
            tomaId: sel.id,
            texto,
            precio: precioTexto(precio),
            deBarra: true,
            cuerpo: { destino_id: carpeta.id, accion: "editar_imagen", modelo: modeloEdicion?.id, instruccion: texto, zona, id_peticion: id },
          }
        : {
            id,
            tipo: "generar",
            texto,
            precio: precioTexto(precio),
            deBarra: true,
            cuerpo: {
              carpeta_id: carpeta.id,
              modelo: modelo?.id,
              texto,
              referencias: refs.map((m) => ({ medio_id: m })),
              relacion,
              cuantas,
              direccion,
              id_peticion: id,
            },
          }
    );
  };

  const autorizar = (o: any) =>
    operar(async () => {
      try {
        await api.autorizarOperacion(o.id);
      } catch (e) {
        if (!esPresupuesto(e)) throw e;
        setConfirmarPresupuesto({ mensaje: (e as Error).message, seguir: () => operar(() => api.autorizarOperacion(o.id, true)) });
      }
    });

  const otraComoEsta = async (t: any) => {
    if (!carpeta || enviando || pendiente) return;
    const id = crypto.randomUUID();
    await enviar({
      id,
      tipo: "generar",
      texto: t.texto || "",
      precio: precioTexto(costeEstimado(porId(t.modelo), { variantes: 1 })),
      cuerpo: {
        carpeta_id: carpeta.id,
        modelo: t.modelo,
        texto: t.texto,
        referencias: (t.referencias || []).map((m: string) => ({ medio_id: m })),
        relacion: t.relacion,
        cuantas: 1,
        direccion: t.direccion || {},
        id_peticion: id,
      },
    });
  };

  const operar = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido.");
    } finally {
      await refrescar();
    }
  };

  const valorar = (t: any, valoracion: string) =>
    operar(() => api.valorarToma(t.id, { valoracion: t.valoracion === valoracion ? "ninguna" : valoracion }));

  const precioDe = (o: any) => precioTexto(o.coste?.estimado ?? null);
  const lineasCargo = (o: any) =>
    (o.coste?.cargos || [])
      .filter((c: any) => c.estado === "pendiente")
      .map((c: any) => `Intento ${c.numero}: posible cargo sin confirmar${c.estimado !== null ? " · " + formatoMoneda(c.estimado, "USD") : ""}`);

  const { nodos, aristas } = useMemo(() => {
    const arbol: NodoArbol[] = [];
    const datos: Record<string, NodoVersionMesa["data"]> = {};
    const textoArista: Record<string, { texto: string; abrir?: () => void; destino: string }> = {};
    for (const t of tomas) {
      const etiqueta = `V${t.numero}`;
      arbol.push({ id: t.id, origen: t.origen_toma_id || null, creado: t.created_at });
      datos[t.id] = {
        tipo: "toma",
        etiqueta,
        imagen: t.medio ? api.urlMedio(t.medio.id) : undefined,
        seleccionada: t.id === seleccion,
        favorita: t.valoracion === "buena",
        descartada: t.valoracion === "descartada",
        pie: t.valoracion === "descartada" ? "descartada" : t.coste?.estimado != null ? `${formatoMoneda(t.coste.estimado, "USD")} est.` : "",
        onSeleccionar: () => seleccionar(t.id),
      };
      if (t.origen_toma_id && t.texto) textoArista[t.id] = { texto: t.texto, destino: etiqueta, abrir: () => seleccionar(t.id) };
    }
    for (const o of abiertas) {
      const n = o.estado === "fallida" || o.estado === "incierta" || o.estado === "presupuestada" ? 1 : o.n || 1;
      for (let i = 0; i < n; i++) {
        const id = `op:${o.id}:${i}`;
        arbol.push({ id, origen: o.origen_toma_id || null, creado: (o.created_at || "") + i });
        const base = { etiqueta: "…", pie: o.accion === "editar_imagen" ? "edición" : "nueva", precio: precioDe(o), mensaje: o.error, cargos: lineasCargo(o) };
        if (EN_MARCHA.includes(o.estado)) datos[id] = { ...base, tipo: "pendiente" };
        else if (o.estado === "fallida")
          datos[id] = {
            ...base,
            tipo: "fallida",
            onReintentar: () => setReintento(o),
            onQuitar: () => operar(() => api.marcarVisto(o.id)),
          };
        else if (o.estado === "incierta")
          datos[id] = {
            ...base,
            tipo: "incierta",
            onComprobar: () => operar(() => api.comprobarOperacion(o.id)),
            onMarcarFallida: () => setMarcarFallida(o),
          };
        else
          datos[id] = {
            ...base,
            tipo: "reintento",
            nuevo: !o.intentos,
            onAutorizar: () => autorizar(o),
            onQuitar: () => operar(() => api.descartarOperacion(o.id)),
          };
        if (o.origen_toma_id && o.texto) textoArista[id] = { texto: o.texto, destino: `op-${o.id}` };
      }
    }
    const pos = colocar(arbol);
    const ids = new Set(arbol.map((a) => a.id));
    const nodos: NodoVersionMesa[] = arbol.map((a) => ({ id: a.id, type: "version", position: pos[a.id], data: datos[a.id] }));
    const aristas: AristaMesa[] = arbol
      .filter((a) => a.origen && ids.has(a.origen))
      .map((a) => ({
        id: `${a.origen}->${a.id}`,
        source: a.origen as string,
        target: a.id,
        type: "instruccion",
        data: { texto: textoArista[a.id]?.texto || "", destino: textoArista[a.id]?.destino || a.id, onAbrir: textoArista[a.id]?.abrir },
      }));
    return { nodos, aristas };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tomas, abiertas, seleccion]);

  const origenSel = sel?.origen_toma_id ? tomas.find((t) => t.id === sel.origen_toma_id) : null;
  const marcadosDir = editando ? (zona ? 1 : 0) : Object.keys(direccion).length;
  const sobranRefs = !editando && refs.length > maxRefs;
  const puedeAccion =
    !!texto.trim() && !enviando && !pendiente && precio !== null && !!carpeta && !sobranRefs && (editando ? !!modeloEdicion?.elegible : !!modelo?.elegible);
  const puedePresupuestar = !!borrador && !sinGuardar && !guardando && !conflictoBorrador && !editando && !!texto.trim() && !sobranRefs;
  const clavePresu = ["presupuesto-mejorar", borrador?.id, borrador?.revision, refs.join(","), relacion, modelo?.id];
  const { data: presu, error: errorPresu, refetch: refetchPresu } = useQuery({
    queryKey: clavePresu,
    queryFn: () =>
      api.presupuestoMejorar(borrador.id, {
        revision: borrador.revision,
        referencias: refs.map((m) => ({ medio_id: m })),
        relacion,
        modelo_imagen: modelo?.id,
      }),
    enabled: puedePresupuestar,
    retry: false,
    staleTime: Infinity,
  });
  const presuVigente = puedePresupuestar && presu && presu.revision === borrador?.revision ? presu : null;
  const puedeMejorar = !!presuVigente && !mejorando && !bloqueoMejora && !ocupadoMejora;
  const fechaTarifa = (f?: string) => (f || "").split("-").reverse().join("-");
  const textoMejorar = !texto.trim()
    ? "Mejorar"
    : conflictoBorrador
      ? "Mejorar · resuelve antes el borrador"
      : guardando || sinGuardar
      ? "Mejorar · guardando…"
      : bloqueoMejora
        ? "Mejorar bloqueado"
        : presuVigente
          ? `Mejorar · ≈ ${formatoMonedaFino(presuVigente.estimacion, "USD")} · reserva estimada ${formatoMonedaFino(presuVigente.reserva_estimada, "USD")}`
          : errorPresu
            ? "Mejorar no disponible"
            : "Mejorar · calculando…";
  const ayudaMejorar = presuVigente
    ? `Estimación y reserva calculadas por Picasso con la tarifa del ${fechaTarifa(presuVigente.tarifa?.verificada_en)}. La salida tiene un tope; la entrada se estima por exceso. Ninguna de las dos es una cifra garantizada por OpenAI.${presuVigente.proveedor === "simulado" ? " Proveedor simulado: no hay gasto real." : ""}`
    : errorPresu instanceof Error
      ? errorPresu.message
      : bloqueoMejora
        ? `Una mejora ${bloqueoMejora.motivo}: revísala y pulsa «Entendido, seguir».`
        : "";

  const ejecutarMejora = async (p: any, idPeticion: string, confirmado: boolean): Promise<void> => {
    setError(null);
    setMejorando(true);
    try {
      const b = await guardarAhora();
      if (b.revision !== p.revision) {
        await refetchPresu();
        setError("El texto cambió: mira el precio nuevo y pulsa otra vez.");
        return;
      }
      await api.mejorar(b.id, { presupuesto_id: p.id, id_peticion: idPeticion, confirmado_por_encima_del_presupuesto: confirmado });
      setVerMejoras(true);
    } catch (e) {
      const d = e instanceof ErrorApi ? e.datos : null;
      if (e instanceof ErrorApi && e.status === 409 && d?.motivo === "precio" && d.presupuesto) {
        qc.setQueryData(clavePresu, d.presupuesto);
        setError(e.message);
      } else if (e instanceof ErrorApi && e.status === 409 && (d?.motivo === "revision" || d?.motivo === "cerrado")) {
        if (d?.borrador) setConflictoBorrador(d.borrador);
        setError(e.message);
      } else if (e instanceof ErrorApi && e.status === 409 && !d && /presupuesto/i.test(e.message)) {
        setConfirmarPresupuesto({ mensaje: e.message, seguir: () => ejecutarMejora(p, idPeticion, true) });
      } else {
        setError(e instanceof Error ? e.message : "No se ha podido mejorar.");
      }
    } finally {
      setMejorando(false);
      await refetchMejoras();
      await refrescar();
    }
  };

  const pulsarMejorar = () => {
    if (!presuVigente || !puedeMejorar) return;
    if (presuVigente.aviso_tarifa) setConfirmarTarifa(presuVigente);
    else void ejecutarMejora(presuVigente, crypto.randomUUID(), false);
  };

  const conMejora = async (fn: () => Promise<unknown>) => {
    setOcupadoMejora(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido.");
    } finally {
      setOcupadoMejora(false);
      await refetchMejoras();
      await refrescar();
    }
  };

  const aceptarMejora = (m: any, usarCopia: boolean, confirmado = false) =>
    conMejora(async () => {
      const b = await guardarAhora();
      try {
        const r = await api.aceptarMejora(b.id, { operacion_id: m.id, revision: b.revision, usar_copia: usarCopia, confirmado });
        setBorrador(r.borrador);
        setTexto(r.borrador.texto);
        setMejora({ antes: r.anterior, cambios: m.resultado?.cambios || [], coste: m.coste?.segun_tarifa ?? null });
        setEditandoTexto(false);
      } catch (e) {
        if (e instanceof ErrorApi && e.status === 409 && e.datos?.motivo === "anterior") setConfirmarAnterior({ m, usarCopia });
        else throw e;
      }
    });

  const tarifa = (m: ModeloCatalogo | null) =>
    !m ? "" : m.coste.verificado ? `tarifa verificada${m.coste.verificado_en ? " el " + m.coste.verificado_en.split("-").reverse().join("-") : ""}` : "precio simulado";

  return (
    <div className="tema-studio flex h-screen flex-col overflow-hidden" data-testid="taller">
      <Cabecera
        migas={[
          { texto: "Estudio", a: "/" },
          { texto: data?.espacio?.nombre || "…", a: `/e/${espacioId}` },
          { texto: "Taller" },
        ]}
      />
      <div className="flex h-[48px] shrink-0 items-center gap-1.5 border-b border-linea bg-superficie px-5">
        {carpetas.map((c) => (
          <button
            key={c.id}
            data-testid={`carpeta-${c.nombre}`}
            onClick={() => elegirCarpeta(c.id)}
            className={
              "h-[32px] rounded-[8px] px-3 text-[13px] " +
              (carpeta?.id === c.id ? "bg-superficie2 font-bold text-tinta shadow-[inset_0_-2px_0_var(--color-acento)]" : "text-tinta2")
            }
          >
            {c.nombre}
          </button>
        ))}
        {nuevaCarpeta === null ? (
          <button onClick={() => setNuevaCarpeta("")} className="h-[32px] rounded-[8px] px-3 text-[13px] text-tinta2">
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
              elegirCarpeta(c.id);
            }}
          >
            <input
              autoFocus
              aria-label="Nombre de la carpeta"
              value={nuevaCarpeta}
              onChange={(e) => setNuevaCarpeta(e.target.value)}
              className="h-[32px] w-44 rounded-[8px] border border-linea bg-superficie2 px-2 text-[13px] text-tinta"
            />
            <button className="h-[32px] rounded-[8px] bg-acento px-3 text-[13px] font-bold text-sobreAcento">Crear</button>
          </form>
        )}
        <span className="ml-auto text-[12px] text-tinta2" data-testid="taller-gasto">
          Gasto del Taller: <b className="text-tinta">{formatoMoneda(data?.gasto?.total || 0, "USD")}</b>
          {data?.gasto && <span className="ml-1">({textoGasto(data.gasto, "USD")})</span>}
        </span>
        <button
          data-testid="abrir-director"
          onClick={() => setPestana((p) => (p === "director" ? null : "director"))}
          className={
            "ml-3 h-[32px] rounded-[10px] px-3.5 text-[13px] font-extrabold " +
            (pestana === "director" ? "bg-acento text-sobreAcento" : "border-[1.5px] border-acento text-acento")
          }
        >
          Director de Studio
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Mesa
            nodos={nodos}
            aristas={aristas}
            ajuste={pestana ? "lateral" : ""}
            vacia={
              <div className="flex flex-col items-center gap-2 text-center text-tinta2">
                <b className="text-[20px] text-tinta">La carpeta está vacía</b>
                <span className="text-[14px]">Escribe abajo qué imagen quieres, añade referencias y pulsa Generar.</span>
              </div>
            }
          />
          {verMejoras && (pendientesMejora.length > 0 || bloqueoMejora) && borrador && (
            <PanelMejora
              mejoras={listaMejoras}
              borrador={borrador}
              bloqueo={bloqueoMejora}
              ocupado={ocupadoMejora}
              reintentos={reintentosMejora}
              onCerrar={() => setVerMejoras(false)}
              onAceptar={(m, usarCopia) => aceptarMejora(m, usarCopia)}
              onDescartar={(m) => conMejora(async () => setBorrador(await api.descartarMejora(borrador.id, m.id)))}
              onGuardarCopia={async (m, t) => {
                try {
                  setBorrador(await api.guardarCopiaMejora(borrador.id, { operacion_id: m.id, texto: t }));
                } catch (e) {
                  setError(e instanceof Error ? e.message : "No se ha podido guardar la copia.");
                }
              }}
              onBorrarCopia={() => conMejora(async () => setBorrador(await api.borrarCopiaMejora(borrador.id)))}
              onPedirReintento={(m) =>
                conMejora(async () => {
                  const p = await api.presupuestoReintento(m.id);
                  setReintentosMejora((r) => ({ ...r, [m.id]: p }));
                })
              }
              onConfirmarReintento={(m) =>
                conMejora(async () => {
                  try {
                    await api.reintentarMejora(m.id, { presupuesto_id: reintentosMejora[m.id].id, confirmado_por_encima_del_presupuesto: false });
                    setReintentosMejora((r) => {
                      const { [m.id]: _, ...resto } = r;
                      return resto;
                    });
                  } catch (e) {
                    if (e instanceof ErrorApi && e.status === 409 && e.datos?.motivo === "precio" && e.datos.presupuesto) {
                      setReintentosMejora((r) => ({ ...r, [m.id]: e.datos.presupuesto }));
                    }
                    throw e;
                  }
                })
              }
              onComprobar={(m) => conMejora(() => api.comprobarOperacion(m.id))}
              onMarcarFallida={(m) => setMarcarFallida({ id: m.id, coste: { estimado: m.reserva_estimada }, precioTexto: formatoMonedaFino(m.reserva_estimada, "USD") })}
              onEntendido={(opId) => conMejora(() => api.entendidoMejora(opId))}
              onResolverCargo={(intentoId, cobrado) => conMejora(() => api.resolverCargo(intentoId, { cobrado }))}
            />
          )}
          {dirAbierta && (
            <div
              data-testid="panel-direccion"
              className="absolute bottom-3 left-5 z-10 flex w-[700px] max-w-[calc(100%-40px)] flex-col gap-2.5 rounded-[16px] border border-linea bg-superficie p-3.5 shadow-context"
            >
              <div className="flex items-center">
                <b className="text-[14px]">{editando ? `Dirección de la edición de V${sel.numero}` : "Dirección de la imagen nueva"}</b>
                <button aria-label="Cerrar dirección" onClick={() => setDirAbierta(false)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] bg-superficie2">
                  <X size={14} />
                </button>
              </div>
              {editando ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-[110px] text-[12px] text-tinta2">Zona del cambio</span>
                  {ZONAS.map(([k, v]) => (
                    <Pastilla key={k} activa={zona === k} data-testid={`zona-${k}`} onClick={() => setZona(zona === k ? null : k)}>
                      {v}
                    </Pastilla>
                  ))}
                </div>
              ) : (
                <>
                  {DIRECCION.map((g) => (
                    <div key={g.clave} className="flex flex-wrap items-center gap-1.5">
                      <span className="w-[110px] text-[12px] text-tinta2">{g.nombre}</span>
                      {g.opciones.map((o) => (
                        <Pastilla
                          key={o}
                          activa={direccion[g.clave] === o}
                          data-testid={`dir-${g.clave}-${o}`}
                          onClick={() => {
                            const siguiente = { ...direccion };
                            if (siguiente[g.clave] === o) delete siguiente[g.clave];
                            else siguiente[g.clave] = o;
                            setDireccion(siguiente);
                          }}
                        >
                          {o}
                        </Pastilla>
                      ))}
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-[110px] text-[12px] text-tinta2">Formato</span>
                    {(modelo?.relaciones || []).map((f) => (
                      <Pastilla key={f} activa={relacion === f} data-testid={`taller-formato-${f}`} onClick={() => setRelacion(f)}>
                        {f}
                      </Pastilla>
                    ))}
                  </div>
                  {limite > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5" data-testid="direccion-cantidad">
                      <span className="w-[110px] text-[12px] text-tinta2">Cantidad</span>
                      {Array.from({ length: limite }, (_, i) => i + 1).map((n) => (
                        <Pastilla key={n} activa={cuantas === n} data-testid={`taller-cuantas-${n}`} onClick={() => setCuantas(n)}>
                          {n}
                        </Pastilla>
                      ))}
                    </div>
                  )}
                </>
              )}
              <span className="text-[12px] leading-[17px] text-tinta2">
                {editando
                  ? `Una imagen por cambio, con el formato del origen (${sel.relacion || "—"}). Lo que no pidas cambiar, Picasso pide conservarlo, sin garantía: compara antes de quedártela.`
                  : `Cada imagen es una petición: ${cuantas} × ${precioTexto(costeEstimado(modelo, { variantes: 1 }))}. Estos controles se suman a tu texto.`}
              </span>
            </div>
          )}
        </div>
        {pestana && (
          <Lateral
            pestana={pestana}
            onPestana={setPestana}
            onCerrar={() => setPestana(null)}
            toma={sel}
            tomas={tomas}
            nombresRef={nombresRef}
            nombreModelo={(id) => porId(id)?.nombre_visible || id || "—"}
            alcance={alcance}
            onFavorita={() => sel && valorar(sel, "buena")}
            onDescartar={() => sel && valorar(sel, "descartada")}
            onNota={(nota) => sel && operar(() => api.valorarToma(sel.id, { nota }))}
            onComparar={() => setComparar(true)}
            otraComoEsta={
              sel && sel.accion !== "editar_imagen"
                ? {
                    texto: `Otra como esta · ${precioTexto(costeEstimado(porId(sel.modelo), { variantes: 1 }))}`,
                    desactivado: enviando || !!pendiente || !porId(sel.modelo)?.elegible,
                    onClick: () => otraComoEsta(sel),
                  }
                : null
            }
          />
        )}
      </div>

      <footer className="z-[2] flex shrink-0 flex-col gap-2 border-t border-linea bg-superficie px-5 pb-3.5 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="taller-alcance"
            className={
              "rounded-[8px] px-3 py-1 text-[13px] font-extrabold " +
              (editando ? "bg-acento text-sobreAcento" : "border border-linea bg-superficie2 text-tinta")
            }
          >
            Alcance: {alcance}
          </span>
          {editando ? (
            <button data-testid="taller-nueva-imagen" onClick={nuevaImagen} className="h-7 rounded-[8px] border border-linea bg-superficie2 px-2.5 text-[12px]">
              Nueva imagen
            </button>
          ) : (
            <>
              {elegidas.map((r) => (
                <span key={r.medio_id} data-testid={`ref-${r.nombre}`} className="flex h-7 items-center gap-1.5 rounded-[8px] bg-superficie2 pl-1 pr-1.5 text-[12px] font-bold">
                  <img src={api.urlMedio(r.medio_id)} alt="" className="h-5 w-5 rounded-[5px] object-cover" />@{r.nombre} · {r.clase ? USO[r.clase] || r.clase : "estilo"}
                  <button aria-label={`Quitar ${r.nombre}`} onClick={() => setRefs(refs.filter((m) => m !== r.medio_id))} className="text-tinta2">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {(!maxRefs || elegidas.length < maxRefs) && (
                <button
                  data-testid="taller-anadir-ref"
                  onClick={() => setElegirRef(true)}
                  disabled={!maxRefs}
                  title={maxRefs ? "" : "Este modelo no admite referencias"}
                  className="h-7 rounded-[8px] border border-dashed border-linea px-2.5 text-[12px] text-tinta2 disabled:opacity-40"
                >
                  + referencia
                </button>
              )}
            </>
          )}
          <span className="ml-auto flex items-center gap-1 text-[12px] text-tinta2">
            {editando ? (
              <span data-testid="taller-modelo-edicion">{modeloEdicion?.nombre_visible || "ningún modelo edita esta imagen"}</span>
            ) : (
              <select
                data-testid="taller-modelo"
                aria-label="Modelo"
                value={modelo?.id || ""}
                onChange={(e) => setModeloId(e.target.value)}
                className="max-w-[200px] bg-transparent text-[12px] text-acento underline"
              >
                {modelos.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.elegible} className="bg-superficie text-tinta">
                    {m.nombre_visible}
                  </option>
                ))}
              </select>
            )}
            · {tarifa(editando ? modeloEdicion : modelo)}
          </span>
        </div>
        <div className="flex items-stretch gap-2.5">
          {editandoTexto || editando ? (
            <textarea
              ref={areaTexto}
              data-testid="taller-texto"
              aria-label={editando ? `Qué cambiar de V${sel.numero}` : "Qué imagen quieres"}
              placeholder={editando ? `Qué cambiar de V${sel.numero} (por ejemplo: ponle un sombrero)` : "Qué imagen quieres (por ejemplo: Juan en su taller, luz de ventana)"}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void accion();
              }}
              className="h-[56px] flex-1 resize-none rounded-[12px] border-[1.5px] border-linea bg-superficie2 px-3 py-2.5 text-[15px] leading-[20px] text-tinta outline-none placeholder:text-tinta3 focus:border-acento"
            />
          ) : (
            <button
              data-testid="taller-texto-mejorado"
              onClick={() => setEditandoTexto(true)}
              title="Pulsa para editar"
              className="h-[56px] flex-1 overflow-auto rounded-[12px] border-2 border-acento bg-superficie2 px-3 py-2 text-left text-[14px] leading-[19px] text-tinta"
            >
              {mejora ? resaltar(mejora.antes, texto) : texto}
            </button>
          )}
          {!editando && (
            <button
              data-testid="taller-mejorar"
              disabled={!puedeMejorar}
              onClick={pulsarMejorar}
              title={ayudaMejorar}
              className="flex w-[210px] items-center gap-2 rounded-[12px] border-[1.5px] border-acento bg-superficie2 px-2.5 text-left text-[12px] font-bold leading-[15px] text-acento disabled:border-linea disabled:opacity-60"
            >
              {mejorando ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <Sparkles size={16} className="shrink-0" />}
              <span className="flex flex-col">
                <span data-testid="taller-mejorar-precio">{textoMejorar}</span>
                {presuVigente?.aviso_tarifa && (
                  <span data-testid="taller-mejorar-aviso-tarifa" className="font-normal text-aviso">
                    {presuVigente.aviso_tarifa.replace("Tarifa", "tarifa")}
                  </span>
                )}
              </span>
            </button>
          )}
          <button
            data-testid="taller-direccion"
            onClick={() => setDirAbierta(!dirAbierta)}
            aria-expanded={dirAbierta}
            className={
              "w-[132px] rounded-[12px] text-[13px] font-bold " +
              (dirAbierta ? "border-[1.5px] border-acento bg-acento text-sobreAcento" : "border-[1.5px] border-linea bg-superficie2 text-tinta")
            }
          >
            Dirección{marcadosDir ? ` · ${marcadosDir}` : ""} ▾
          </button>
          <button
            data-testid="taller-generar"
            disabled={!puedeAccion}
            onClick={accion}
            className="flex w-[230px] items-center justify-center gap-2 rounded-[12px] bg-acento text-[15px] font-extrabold text-sobreAcento hover:bg-acentoTinta disabled:opacity-45"
          >
            {enviando && <Loader2 size={16} className="animate-spin" />}
            {enviando ? "Enviando…" : editando ? `Aplicar cambio · ${precioTexto(precio)}` : `Generar${cuantas > 1 ? " " + cuantas : ""} · ${precioTexto(precio)}`}
          </button>
        </div>
        <div className="flex min-h-[18px] flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-tinta2">
          {pendiente && !enviando && (
            <span className="flex flex-wrap items-center gap-2 text-aviso" data-testid="taller-pendiente">
              {pendiente.noLlego
                ? `El servidor no recibió «${pendiente.texto.slice(0, 40)}»: puedes enviarla otra vez, con el mismo identificador.`
                : `Petición sin respuesta: «${pendiente.texto.slice(0, 40)}». Compruébala antes de repetir.`}
              {pendiente.noLlego ? (
                <button data-testid="pendiente-reenviar" className="text-acento underline" onClick={() => enviar(pendiente)}>
                  Enviar otra vez · {pendiente.precio}
                </button>
              ) : (
                <button data-testid="pendiente-comprobar" className="text-acento underline" onClick={() => comprobarPendiente(pendiente)}>
                  Comprobar
                </button>
              )}
              {pendiente.noLlego && (
                <button data-testid="pendiente-descartar" className="text-tinta2 underline" onClick={() => guardarPendiente(null)}>
                  Descartar
                </button>
              )}
            </span>
          )}
          {conflictoBorrador && (
            <span className="flex flex-wrap items-center gap-2 text-aviso" data-testid="borrador-conflicto">
              El borrador cambió en otra ventana (revisión {conflictoBorrador.revision}). Tu texto se conserva.
              <button
                data-testid="borrador-usar-servidor"
                className="text-acento underline"
                onClick={() => {
                  setBorrador(conflictoBorrador);
                  setTexto(conflictoBorrador.texto);
                  setConflictoBorrador(null);
                  setError(null);
                }}
              >
                Usar el del servidor
              </button>
              <button
                data-testid="borrador-mantener"
                className="text-acento underline"
                onClick={() => {
                  setBorrador(conflictoBorrador);
                  setConflictoBorrador(null);
                  setError(null);
                }}
              >
                Mantener el mío
              </button>
            </span>
          )}
          {!editando && !presuVigente && errorPresu instanceof Error && texto.trim() && !sinGuardar && (
            <span className="text-aviso" data-testid="mejorar-aviso">
              Mejorar: {errorPresu.message}
            </span>
          )}
          {!verMejoras && (pendientesMejora.length > 0 || bloqueoMejora) && (
            <button data-testid="ver-mejoras" className="text-acento underline" onClick={() => setVerMejoras(true)}>
              Propuestas de Mejorar · {pendientesMejora.length}
            </button>
          )}
          {error || sobranRefs ? (
            <span className="text-error" data-testid="taller-error">
              {error || (maxRefs ? `Este modelo admite ${maxRefs} referencias: quita ${refs.length - maxRefs}.` : "Este modelo no admite referencias: quítalas o elige otro modelo.")}
            </span>
          ) : mejora && !editando ? (
            <>
              <span className="text-acentoTinta">Mejorada · lo nuevo, resaltado · {mejora.coste === null ? "coste sin informar por OpenAI: posible cargo pendiente" : `${formatoMonedaFino(mejora.coste, "USD")} según tarifa`}</span>
              <button className="text-acento underline" onClick={() => { setTexto(mejora.antes); setMejora(null); setEditandoTexto(true); }}>
                Deshacer
              </button>
              <button className="text-acento underline" onClick={() => setVerPorque(true)}>
                Por qué
              </button>
            </>
          ) : (
            <span>
              {enviando
                ? "El botón queda bloqueado mientras se envía: un doble clic no crea otra imagen."
                : editando
                  ? "El clic en el botón es la autorización. El modelo puede alterar otros detalles: compara antes de quedártela."
                  : "El clic en el botón es la autorización. Nada se envía antes."}
              {enCurso && !enviando ? " Hay imágenes generándose en la Mesa." : ""}
            </span>
          )}
          {faltan.length > 0 && (
            <span className="flex flex-wrap items-center gap-1.5" data-testid="taller-le-falta">
              Le falta:
              {faltan.map((p) => (
                <button key={p} onClick={() => completar(p)} className="h-6 rounded-full border border-acento px-2 text-[12px] text-acento">
                  + {p}
                </button>
              ))}
            </span>
          )}
          {!editando && delPrompt && textoRetardado.trim() && (
            <span className="ml-auto flex items-center gap-1.5" title={delPrompt.motivo} data-testid="taller-ingredientes">
              <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NIVEL[delPrompt.nivel] }} />
              Descripción: {delPrompt.nivel === "verde" ? "completa" : "mejorable"}
            </span>
          )}
        </div>
      </footer>

      {comparar && sel && origenSel && (
        <ComparadorTomas
          relacion={(sel.relacion || "1:1").replace(":", " / ")}
          tomas={[origenSel, sel]}
          elegidaId={null}
          onElegir={async (t) => {
            await valorar(t, "buena");
          }}
          onCerrar={() => setComparar(false)}
        />
      )}

      <Dialogo abierto={!!reintento} onCerrar={() => setReintento(null)} titulo="Reintentar" data-testid="dialogo-reintentar">
        <p className="text-[14px] leading-[20px] text-tinta2">Es un envío nuevo: necesita tu autorización otra vez. El posible cargo del intento anterior, si lo hubo, sigue apuntado en el Registro.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setReintento(null)}>Cancelar</Boton>
          <Boton
            data-testid="confirmar-reintento"
            onClick={async () => {
              const o = reintento;
              setReintento(null);
              await operar(() => api.reintentarOperacion(o.id));
              await autorizar(o);
            }}
          >
            Reintentar · {reintento ? precioDe(reintento) : ""}
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={!!confirmarPresupuesto} onCerrar={() => setConfirmarPresupuesto(null)} titulo="Supera el presupuesto" data-testid="dialogo-presupuesto">
        <p className="text-[14px] leading-[20px] text-tinta2">{confirmarPresupuesto?.mensaje}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmarPresupuesto(null)}>Cancelar</Boton>
          <Boton
            data-testid="confirmar-presupuesto"
            onClick={async () => {
              const c = confirmarPresupuesto;
              setConfirmarPresupuesto(null);
              if (c) await c.seguir();
            }}
          >
            Autorizar igualmente
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={!!confirmarTarifa} onCerrar={() => setConfirmarTarifa(null)} titulo="Tarifa sin verificar" data-testid="dialogo-tarifa">
        <p className="text-[14px] leading-[20px] text-tinta2">
          {confirmarTarifa?.aviso_tarifa}. Mejorar sigue disponible, pero la reserva estimada ({formatoMonedaFino(confirmarTarifa?.reserva_estimada, "USD")}) se calcula con esa tarifa.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmarTarifa(null)}>Cancelar</Boton>
          <Boton
            data-testid="confirmar-tarifa"
            onClick={async () => {
              const p = confirmarTarifa;
              setConfirmarTarifa(null);
              if (p) await ejecutarMejora(p, crypto.randomUUID(), false);
            }}
          >
            Mejorar · reserva estimada {formatoMonedaFino(confirmarTarifa?.reserva_estimada, "USD")}
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={!!confirmarAnterior} onCerrar={() => setConfirmarAnterior(null)} titulo="Propuesta para un texto anterior" data-testid="dialogo-anterior">
        <p className="text-[14px] leading-[20px] text-tinta2">Sustituirá lo que tienes ahora en la barra.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmarAnterior(null)}>Cancelar</Boton>
          <Boton
            data-testid="confirmar-anterior"
            onClick={async () => {
              const c = confirmarAnterior;
              setConfirmarAnterior(null);
              if (c) await aceptarMejora(c.m, c.usarCopia, true);
            }}
          >
            Sustituir
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={!!marcarFallida} onCerrar={() => setMarcarFallida(null)} titulo="Marcar como fallida" data-testid="dialogo-marcar-fallida">
        <p className="text-[14px] leading-[20px] text-tinta2">
          Se envió y no hubo respuesta: el proveedor pudo cobrar. Quedará como posible cargo sin confirmar ({marcarFallida ? marcarFallida.precioTexto || precioDe(marcarFallida) : ""}) hasta que lo revises en el Registro.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setMarcarFallida(null)}>Cancelar</Boton>
          <Boton
            data-testid="confirmar-marcar-fallida"
            onClick={async () => {
              const o = marcarFallida;
              setMarcarFallida(null);
              await operar(() => api.marcarFallida(o.id));
            }}
          >
            Marcar como fallida
          </Boton>
        </div>
      </Dialogo>

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
            <li key={i}>
              <b>{c.parte}.</b> {c.motivo}
            </li>
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
