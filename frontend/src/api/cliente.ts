import type {
  Ajustes,
  Desarrollo,
  Elemento,
  Entorno,
  EntradaReparto,
  Escena,
  Espacio,
  FichaVersion,
  Medio,
  Pieza,
  Proyecto,
  Recorrido,
  VistaGuion,
  VistaProyecto,
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
  guardarDesarrollo: (pid: string, datos: Desarrollo) =>
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
};

export { ErrorApi };
