const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

async function peticion(ruta, opciones = {}) {
  const esForm = opciones.body instanceof FormData;
  const resp = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: esForm ? opciones.headers : { "Content-Type": "application/json", ...(opciones.headers || {}) },
  });
  if (resp.status === 204) return null;
  let cuerpo = null;
  try {
    cuerpo = await resp.json();
  } catch (e) {
    cuerpo = null;
  }
  if (!resp.ok) {
    const detalle = (cuerpo && cuerpo.detail) || `Error ${resp.status}`;
    throw new ErrorApi(detalle, resp.status);
  }
  return cuerpo;
}

export const api = {
  estudio: () => peticion("/estudio"),
  recorridos: () => peticion("/recorridos"),
  ajustes: () => peticion("/ajustes"),
  guardarAjustes: (datos) => peticion("/ajustes", { method: "PUT", body: JSON.stringify(datos) }),

  espacios: () => peticion("/espacios"),
  crearEspacio: (datos) => peticion("/espacios", { method: "POST", body: JSON.stringify(datos) }),
  espacio: (id) => peticion(`/espacios/${id}`),
  editarEspacio: (id, datos) => peticion(`/espacios/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),

  proyectos: (espacioId) => peticion(`/espacios/${espacioId}/proyectos`),
  crearProyecto: (espacioId, datos) =>
    peticion(`/espacios/${espacioId}/proyectos`, { method: "POST", body: JSON.stringify(datos) }),
  proyecto: (id) => peticion(`/proyectos/${id}`),
  guardarUbicacion: (id, ruta) =>
    peticion(`/proyectos/${id}/ubicacion`, {
      method: "POST",
      body: JSON.stringify({ ultima_ubicacion: ruta }),
    }),

  desarrollo: (pid) => peticion(`/proyectos/${pid}/desarrollo`),
  guardarDesarrollo: (pid, datos) =>
    peticion(`/proyectos/${pid}/desarrollo`, { method: "PUT", body: JSON.stringify(datos) }),
  formatos: (tipo) => peticion(`/formatos?tipo=${tipo}`),
  asistenteEstado: () => peticion("/asistente/estado"),
  proponer: (pid, tarea, datos) =>
    peticion(`/proyectos/${pid}/asistente/${tarea}`, { method: "POST", body: JSON.stringify(datos || {}) }),
  resolverParte: (propId, parteId, datos) =>
    peticion(`/propuestas/${propId}/parte/${parteId}`, { method: "POST", body: JSON.stringify(datos) }),

  // --- Fase 3: medios, elementos, fichas, reparto, biblioteca ---
  medios: (espacioId, clase) =>
    peticion(`/espacios/${espacioId}/medios${clase ? `?clase=${clase}` : ""}`),
  subirMedio: (espacioId, archivo, etiqueta) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    if (etiqueta) fd.append("etiqueta", etiqueta);
    return peticion(`/espacios/${espacioId}/medios`, { method: "POST", body: fd });
  },
  subirMedioConProgreso: (espacioId, archivo, onProgreso) =>
    new Promise((resolver, rechazar) => {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/espacios/${espacioId}/medios`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgreso) onProgreso(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let cuerpo = null;
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
  borrarMedio: (medioId) => peticion(`/medios/${medioId}`, { method: "DELETE" }),
  urlMedio: (medioId) => `${BASE}/medios/${medioId}/archivo`,

  elementos: (espacioId, clase) =>
    peticion(`/espacios/${espacioId}/elementos${clase ? `?clase=${clase}` : ""}`),
  crearElemento: (espacioId, datos) =>
    peticion(`/espacios/${espacioId}/elementos`, { method: "POST", body: JSON.stringify(datos) }),
  elemento: (id) => peticion(`/elementos/${id}`),
  editarElemento: (id, datos) =>
    peticion(`/elementos/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  borrarElemento: (id) => peticion(`/elementos/${id}`, { method: "DELETE" }),

  crearVersionFicha: (elementoId) =>
    peticion(`/elementos/${elementoId}/fichas`, { method: "POST" }),
  editarFicha: (fichaId, datos) =>
    peticion(`/fichas/${fichaId}`, { method: "PATCH", body: JSON.stringify(datos) }),
  aprobarFicha: (fichaId) => peticion(`/fichas/${fichaId}/aprobar`, { method: "POST" }),

  reparto: (proyectoId, clase) =>
    peticion(`/proyectos/${proyectoId}/reparto${clase ? `?clase=${clase}` : ""}`),
  anadirAlReparto: (proyectoId, datos) =>
    peticion(`/proyectos/${proyectoId}/reparto`, { method: "POST", body: JSON.stringify(datos) }),
  editarReparto: (proyectoId, entradaId, datos) =>
    peticion(`/proyectos/${proyectoId}/reparto/${entradaId}`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  quitarDelReparto: (proyectoId, entradaId) =>
    peticion(`/proyectos/${proyectoId}/reparto/${entradaId}`, { method: "DELETE" }),

  biblioteca: (espacioId) => peticion(`/espacios/${espacioId}/biblioteca`),
  editarProyecto: (id, datos) => peticion(`/proyectos/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
};

export { ErrorApi };
