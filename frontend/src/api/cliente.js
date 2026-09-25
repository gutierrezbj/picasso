const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

async function peticion(ruta, opciones = {}) {
  const resp = await fetch(`${BASE}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
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
};

export { ErrorApi };
