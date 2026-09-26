import type {
  Accion,
  Ajustes,
  AvisoEncadenado,
  Desarrollo,
  Elemento,
  Entorno,
  EntradaReparto,
  Escena,
  Espacio,
  FichaVersion,
  LayoutLienzo,
  Medio,
  ModeloCatalogo,
  Operacion,
  OpcionesDireccion,
  Pieza,
  Plano,
  Presupuesto,
  PromptVista,
  Proyecto,
  Recorrido,
  Toma,
  TotalesRegistro,
  VistaGuion,
  VocesEscena,
  VistaMontaje,
  Exportacion,
  PistaAudio,
  VozDialogoVista,
  VistaLienzo,
  VistaOperacion,
  VistaProduccion,
  VistaProyecto,
  VistaTomas,
} from "../tipos";

const BASE = `${import.meta.env.REACT_APP_BACKEND_URL}/api`;

class ErrorApi extends Error {
  status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

async function peticion<T = any>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const esForm = opciones.body instanceof FormData;
  const resp = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: esForm
      ? opciones.headers
      : { "Content-Type": "application/json", ...(opciones.headers || {}) },
  });
  if (resp.status === 204) return null as T;
  let cuerpo: any = null;
  try {
    cuerpo = await resp.json();
  } catch (e) {
    cuerpo = null;
  }
  if (!resp.ok) {
    const detalle = (cuerpo && cuerpo.detail) || `Error ${resp.status}`;
    throw new ErrorApi(detalle, resp.status);
  }
  return cuerpo as T;
}

export const api = {
  estudio: () => peticion<any>("/estudio"),
  entorno: () => peticion<Entorno>("/entorno"),
  recorridos: () => peticion<Recorrido[]>("/recorridos"),
  ajustes: () => peticion<Ajustes>("/ajustes"),
  guardarAjustes: (datos: Partial<Ajustes>) =>
    peticion<Ajustes>("/ajustes", { method: "PUT", body: JSON.stringify(datos) }),

  espacios: () => peticion<Espacio[]>("/espacios"),
  crearEspacio: (datos: Record<string, unknown>) =>
    peticion<Espacio>("/espacios", { method: "POST", body: JSON.stringify(datos) }),
  espacio: (id: string) => peticion<any>(`/espacios/${id}`),
  editarEspacio: (id: string, datos: Record<string, unknown>) =>
    peticion<Espacio>(`/espacios/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),

  proyectos: (espacioId: string) => peticion<any[]>(`/espacios/${espacioId}/proyectos`),
  crearProyecto: (espacioId: string, datos: Record<string, unknown>) =>
    peticion<Proyecto>(`/espacios/${espacioId}/proyectos`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  proyecto: (id: string) => peticion<VistaProyecto>(`/proyectos/${id}`),
  guardarUbicacion: (id: string, ruta: string) =>
    peticion(`/proyectos/${id}/ubicacion`, {
      method: "POST",
      body: JSON.stringify({ ultima_ubicacion: ruta }),
    }),

  desarrollo: (pid: string) => peticion<Desarrollo>(`/proyectos/${pid}/desarrollo`),
  guardarDesarrollo: (pid: string, datos: Record<string, unknown>) =>
    peticion<Desarrollo>(`/proyectos/${pid}/desarrollo`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  formatos: (tipo: string) => peticion<any[]>(`/formatos?tipo=${tipo}`),
  asistenteEstado: () => peticion<any>("/asistente/estado"),
  proponer: (pid: string, tarea: string, datos?: Record<string, unknown>) =>
    peticion<any>(`/proyectos/${pid}/asistente/${tarea}`, {
      method: "POST",
      body: JSON.stringify(datos || {}),
    }),
  resolverParte: (propId: string, parteId: string, datos: Record<string, unknown>) =>
    peticion<any>(`/propuestas/${propId}/parte/${parteId}`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  // --- Fase 3: medios, elementos, fichas, reparto, biblioteca ---
  medios: (espacioId: string, clase?: string) =>
    peticion<Medio[]>(`/espacios/${espacioId}/medios${clase ? `?clase=${clase}` : ""}`),
  subirMedio: (espacioId: string, archivo: File, etiqueta?: string) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    if (etiqueta) fd.append("etiqueta", etiqueta);
    return peticion<Medio>(`/espacios/${espacioId}/medios`, { method: "POST", body: fd });
  },
  subirMedioConProgreso: (
    espacioId: string,
    archivo: File,
    onProgreso?: (pct: number) => void
  ): Promise<Medio> =>
    new Promise((resolver, rechazar) => {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/espacios/${espacioId}/medios`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgreso) onProgreso(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let cuerpo: any = null;
        try {
          cuerpo = JSON.parse(xhr.responseText);
        } catch (e) {
          cuerpo = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) resolver(cuerpo);
        else rechazar(new ErrorApi((cuerpo && cuerpo.detail) || `Error ${xhr.status}`, xhr.status));
      };
      xhr.onerror = () => rechazar(new ErrorApi("No se ha podido subir el archivo.", 0));
      xhr.send(fd);
    }),
  borrarMedio: (medioId: string) => peticion(`/medios/${medioId}`, { method: "DELETE" }),
  urlMedio: (medioId: string) => `${BASE}/medios/${medioId}/archivo`,

  elementos: (espacioId: string, clase?: string) =>
    peticion<Elemento[]>(`/espacios/${espacioId}/elementos${clase ? `?clase=${clase}` : ""}`),
  crearElemento: (espacioId: string, datos: Record<string, unknown>) =>
    peticion<Elemento>(`/espacios/${espacioId}/elementos`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  elemento: (id: string) => peticion<Elemento>(`/elementos/${id}`),
  editarElemento: (id: string, datos: Record<string, unknown>) =>
    peticion<Elemento>(`/elementos/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  borrarElemento: (id: string) => peticion(`/elementos/${id}`, { method: "DELETE" }),

  crearVersionFicha: (elementoId: string) =>
    peticion<FichaVersion>(`/elementos/${elementoId}/fichas`, { method: "POST" }),
  editarFicha: (fichaId: string, datos: Record<string, unknown>) =>
    peticion<FichaVersion>(`/fichas/${fichaId}`, { method: "PATCH", body: JSON.stringify(datos) }),
  aprobarFicha: (fichaId: string) =>
    peticion<FichaVersion>(`/fichas/${fichaId}/aprobar`, { method: "POST" }),

  reparto: (proyectoId: string, clase?: string) =>
    peticion<EntradaReparto[]>(`/proyectos/${proyectoId}/reparto${clase ? `?clase=${clase}` : ""}`),
  anadirAlReparto: (proyectoId: string, datos: Record<string, unknown>) =>
    peticion<EntradaReparto>(`/proyectos/${proyectoId}/reparto`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  editarReparto: (proyectoId: string, entradaId: string, datos: Record<string, unknown>) =>
    peticion<EntradaReparto>(`/proyectos/${proyectoId}/reparto/${entradaId}`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  quitarDelReparto: (proyectoId: string, entradaId: string) =>
    peticion(`/proyectos/${proyectoId}/reparto/${entradaId}`, { method: "DELETE" }),

  biblioteca: (espacioId: string) => peticion<any>(`/espacios/${espacioId}/biblioteca`),
  editarProyecto: (id: string, datos: Record<string, unknown>) =>
    peticion<Proyecto>(`/proyectos/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),

  // --- Fase 4: piezas, guion y escenas ---
  piezas: (proyectoId: string) => peticion<Pieza[]>(`/proyectos/${proyectoId}/piezas`),
  crearPieza: (proyectoId: string, datos: Record<string, unknown>) =>
    peticion<Pieza>(`/proyectos/${proyectoId}/piezas`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  editarPieza: (id: string, datos: Record<string, unknown>) =>
    peticion<Pieza>(`/piezas/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  borrarPieza: (id: string) => peticion(`/piezas/${id}`, { method: "DELETE" }),

  guion: (piezaId: string) => peticion<VistaGuion>(`/piezas/${piezaId}/guion`),
  escena: (id: string) => peticion<Escena>(`/escenas/${id}`),
  crearEscena: (piezaId: string, datos: Record<string, unknown>) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/escenas`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  editarEscena: (id: string, datos: Record<string, unknown>) =>
    peticion<Escena>(`/escenas/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  borrarEscena: (id: string) => peticion<VistaGuion>(`/escenas/${id}`, { method: "DELETE" }),
  moverEscena: (id: string, datos: Record<string, unknown>) =>
    peticion<VistaGuion>(`/escenas/${id}/mover`, { method: "POST", body: JSON.stringify(datos) }),
  guardarEncargo: (piezaId: string, datos: Record<string, unknown>) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/encargo`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  aprobarGuion: (piezaId: string) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/aprobar`, { method: "POST" }),
  aprobarRevision: (piezaId: string, marcas: Record<string, string>) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/revision/aprobar`, {
      method: "POST",
      body: JSON.stringify({ marcas }),
    }),
  descartarRevision: (piezaId: string) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/revision/descartar`, { method: "POST" }),
  crearRevision: (piezaId: string) =>
    peticion<VistaGuion>(`/piezas/${piezaId}/guion/revision`, { method: "POST" }),

  // --- Fase 5: lienzo, planos, dirección ---
  lienzo: (piezaId: string) => peticion<VistaLienzo>(`/piezas/${piezaId}/lienzo`),
  opcionesDireccion: () => peticion<OpcionesDireccion>("/direccion/opciones"),
  guardarLayout: (proyectoId: string, datos: LayoutLienzo) =>
    peticion<LayoutLienzo>(`/proyectos/${proyectoId}/lienzo`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  crearPlano: (escenaId: string, datos: Record<string, unknown> = {}) =>
    peticion<Plano>(`/escenas/${escenaId}/planos`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  editarPlano: (id: string, datos: Record<string, unknown>) =>
    peticion<Plano>(`/planos/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  borrarPlano: (id: string) =>
    peticion<{ ok: boolean; avisos_encadenado: AvisoEncadenado[] }>(`/planos/${id}`, {
      method: "DELETE",
    }),
  moverPlano: (id: string, datos: { direccion?: string; a?: number }) =>
    peticion<{ ok: boolean; orden: string[]; avisos_encadenado: AvisoEncadenado[] }>(
      `/planos/${id}/mover`,
      { method: "POST", body: JSON.stringify(datos) }
    ),
  duplicarPlano: (id: string) => peticion<Plano>(`/planos/${id}/duplicar`, { method: "POST" }),
  dividirPlano: (id: string) =>
    peticion<Plano & { avisos_encadenado?: AvisoEncadenado[] }>(`/planos/${id}/dividir`, {
      method: "POST",
    }),
  crearCorreccion: (planoId: string, texto: string) =>
    peticion<Plano>(`/planos/${planoId}/correcciones`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),
  editarCorreccion: (planoId: string, correccionId: string, estado: "pendiente" | "hecha") =>
    peticion<Plano>(`/planos/${planoId}/correcciones/${correccionId}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
  borrarCorreccion: (planoId: string, correccionId: string) =>
    peticion<Plano>(`/planos/${planoId}/correcciones/${correccionId}`, { method: "DELETE" }),
  prompt: (planoId: string) => peticion<PromptVista>(`/planos/${planoId}/prompt`),
  guardarPrompt: (planoId: string, texto: string) =>
    peticion<PromptVista>(`/planos/${planoId}/prompt`, {
      method: "PUT",
      body: JSON.stringify({ texto }),
    }),
  reconstruirPrompt: (planoId: string) =>
    peticion<PromptVista>(`/planos/${planoId}/prompt/reconstruir`, { method: "POST" }),

  // --- Fase 6: motor (§9), tomas y registro ---
  catalogo: (accion?: Accion) =>
    peticion<ModeloCatalogo[]>(`/catalogo${accion ? `?accion=${accion}` : ""}`),
  produccion: (planoId: string) => peticion<VistaProduccion>(`/planos/${planoId}/produccion`),
  prepararOperacion: (datos: Record<string, unknown>) =>
    peticion<VistaOperacion>("/operaciones", { method: "POST", body: JSON.stringify(datos) }),
  editarOperacion: (id: string, datos: Record<string, unknown>) =>
    peticion<VistaOperacion>(`/operaciones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  autorizarOperacion: (id: string, confirmado = false) =>
    peticion<VistaOperacion>(`/operaciones/${id}/autorizar`, {
      method: "POST",
      body: JSON.stringify({ confirmado_por_encima_del_presupuesto: confirmado }),
    }),
  comprobarOperacion: (id: string) =>
    peticion<VistaOperacion>(`/operaciones/${id}/comprobar`, { method: "POST" }),
  marcarFallida: (id: string) =>
    peticion<VistaOperacion>(`/operaciones/${id}/marcar-fallida`, { method: "POST" }),
  reintentarOperacion: (id: string) =>
    peticion<VistaOperacion>(`/operaciones/${id}/reintentar`, { method: "POST" }),
  descartarOperacion: (id: string) => peticion(`/operaciones/${id}`, { method: "DELETE" }),
  explorarEncuadres: (planoId: string, datos: Record<string, unknown>) =>
    peticion<VistaOperacion>(`/planos/${planoId}/explorar-encuadres`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  prepararCorreccion: (correccionId: string, datos: Record<string, unknown>) =>
    peticion<VistaOperacion>(`/correcciones/${correccionId}/preparar`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  tomas: (planoId: string) => peticion<VistaTomas>(`/planos/${planoId}/tomas`),
  elegirToma: (tomaId: string) => peticion<Plano>(`/tomas/${tomaId}/elegir`, { method: "POST" }),
  exportar: (piezaId: string, datos: { alternativas: boolean; rutas: string; carpeta_destino?: string }) =>
    peticion<Exportacion>(`/piezas/${piezaId}/exportar`, { method: "POST", body: JSON.stringify(datos) }),
  exportacion: (id: string) => peticion<Exportacion>(`/exportaciones/${id}`),
  exportaciones: (piezaId: string) => peticion<Exportacion[]>(`/piezas/${piezaId}/exportaciones`),
  urlExportacion: (id: string) => `${BASE}/exportaciones/${id}/archivo`,
  montaje: (piezaId: string) => peticion<VistaMontaje>(`/piezas/${piezaId}/montaje`),
  anadirPista: (piezaId: string, datos: { capa: string; medio_id: string; inicio_s?: number; volumen_db?: number }) =>
    peticion<PistaAudio>(`/piezas/${piezaId}/pistas`, { method: "POST", body: JSON.stringify(datos) }),
  editarPista: (pistaId: string, datos: { inicio_s?: number; volumen_db?: number; nombre?: string }) =>
    peticion<PistaAudio>(`/pistas/${pistaId}`, { method: "PATCH", body: JSON.stringify(datos) }),
  quitarPista: (pistaId: string) => peticion<{ ok: boolean }>(`/pistas/${pistaId}`, { method: "DELETE" }),
  vocesEscena: (escenaId: string) => peticion<VocesEscena>(`/escenas/${escenaId}/voces`),
  editarVoz: (dialogoId: string, datos: { plano_id?: string; desfase_s?: number }) =>
    peticion<VozDialogoVista>(`/voces/${dialogoId}`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  valorarToma: (tomaId: string, datos: Record<string, unknown>) =>
    peticion<Toma>(`/tomas/${tomaId}`, { method: "PATCH", body: JSON.stringify(datos) }),
  ajustarToma: (tomaId: string, datos: Record<string, unknown>) =>
    peticion<VistaOperacion>(`/tomas/${tomaId}/ajustar`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  fijarExploracion: (tomaId: string, momento: "inicio" | "final") =>
    peticion<Plano>(`/exploraciones/${tomaId}/fijar`, {
      method: "POST",
      body: JSON.stringify({ momento }),
    }),
  usarExploracionComoToma: (tomaId: string) =>
    peticion<Toma>(`/exploraciones/${tomaId}/usar-como-toma`, { method: "POST" }),
  moverPlanoAEscena: (planoId: string, escenaId: string) =>
    peticion<Plano>(`/planos/${planoId}/mover-a-escena`, {
      method: "POST",
      body: JSON.stringify({ escena_id: escenaId }),
    }),
  prepararReferencias: (fichaId: string, datos: Record<string, unknown>) =>
    peticion<VistaOperacion>(`/fichas/${fichaId}/preparar-referencias`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  tomasDeFicha: (fichaId: string) =>
    peticion<{ tomas: Toma[] }>(`/fichas/${fichaId}/tomas`),
  pasarTomaAFicha: (tomaId: string, rol: string) =>
    peticion<FichaVersion>(`/tomas/${tomaId}/pasar-a-ficha`, {
      method: "POST",
      body: JSON.stringify({ rol }),
    }),
  operaciones: (filtros: Record<string, string>) =>
    peticion<Operacion[]>(`/operaciones?${new URLSearchParams(filtros).toString()}`),
  totalesRegistro: (filtros: Record<string, string>) =>
    peticion<TotalesRegistro>(`/registro/totales?${new URLSearchParams(filtros).toString()}`),
  urlRegistroCsv: (filtros: Record<string, string>) =>
    `${BASE}/registro/exportar.csv?${new URLSearchParams(filtros).toString()}`,
  gastoProyecto: (proyectoId: string) =>
    peticion<Presupuesto>(`/proyectos/${proyectoId}/gasto`),
  urlEventos: (proyectoId: string) => `${BASE}/eventos?proyecto_id=${proyectoId}`,
};

export { ErrorApi };
