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
};

export { ErrorApi };
