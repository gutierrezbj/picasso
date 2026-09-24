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
