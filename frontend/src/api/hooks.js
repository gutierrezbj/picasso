import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./cliente";

export const useEstudio = () => useQuery({ queryKey: ["estudio"], queryFn: api.estudio });
export const useRecorridos = () => useQuery({ queryKey: ["recorridos"], queryFn: api.recorridos });
export const useAjustes = () => useQuery({ queryKey: ["ajustes"], queryFn: api.ajustes });
export const useEspacio = (id) =>
  useQuery({ queryKey: ["espacio", id], queryFn: () => api.espacio(id), enabled: !!id });
export const useProyectos = (espacioId) =>
  useQuery({ queryKey: ["proyectos", espacioId], queryFn: () => api.proyectos(espacioId), enabled: !!espacioId });
export const useProyecto = (id) =>
  useQuery({ queryKey: ["proyecto", id], queryFn: () => api.proyecto(id), enabled: !!id });
export const useDesarrollo = (id) =>
  useQuery({ queryKey: ["desarrollo", id], queryFn: () => api.desarrollo(id), enabled: !!id });
export const useFormato = (tipo) =>
  useQuery({ queryKey: ["formato", tipo], queryFn: () => api.formatos(tipo), enabled: !!tipo });
export const useAsistenteEstado = () =>
  useQuery({ queryKey: ["asistente-estado"], queryFn: api.asistenteEstado });
export const useMedios = (espacioId, clase) =>
  useQuery({
    queryKey: ["medios", espacioId, clase || "todos"],
    queryFn: () => api.medios(espacioId, clase),
    enabled: !!espacioId,
  });
export const useElementos = (espacioId, clase) =>
  useQuery({
    queryKey: ["elementos", espacioId, clase || "todos"],
    queryFn: () => api.elementos(espacioId, clase),
    enabled: !!espacioId,
  });
export const useReparto = (proyectoId, clase) =>
  useQuery({
    queryKey: ["reparto", proyectoId, clase || "todos"],
    queryFn: () => api.reparto(proyectoId, clase),
    enabled: !!proyectoId,
  });
export const useBiblioteca = (espacioId) =>
  useQuery({ queryKey: ["biblioteca", espacioId], queryFn: () => api.biblioteca(espacioId), enabled: !!espacioId });

export function useCrearEspacio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.crearEspacio,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estudio"] });
      qc.invalidateQueries({ queryKey: ["espacios"] });
    },
  });
}

export function useCrearProyecto(espacioId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos) => api.crearProyecto(espacioId, datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos", espacioId] });
      qc.invalidateQueries({ queryKey: ["espacio", espacioId] });
      qc.invalidateQueries({ queryKey: ["estudio"] });
    },
  });
}
