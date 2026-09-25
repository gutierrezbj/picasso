import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./cliente";

export const useEstudio = () => useQuery({ queryKey: ["estudio"], queryFn: api.estudio });
export const useRecorridos = () => useQuery({ queryKey: ["recorridos"], queryFn: api.recorridos });
export const useAjustes = () => useQuery({ queryKey: ["ajustes"], queryFn: api.ajustes });
export const useEspacio = (id?: string) =>
  useQuery({ queryKey: ["espacio", id], queryFn: () => api.espacio(id!), enabled: !!id });
export const useProyectos = (espacioId?: string) =>
  useQuery({
    queryKey: ["proyectos", espacioId],
    queryFn: () => api.proyectos(espacioId!),
    enabled: !!espacioId,
  });
export const useProyecto = (id?: string) =>
  useQuery({ queryKey: ["proyecto", id], queryFn: () => api.proyecto(id!), enabled: !!id });
export const useDesarrollo = (id?: string) =>
  useQuery({ queryKey: ["desarrollo", id], queryFn: () => api.desarrollo(id!), enabled: !!id });
export const useFormato = (tipo?: string) =>
  useQuery({ queryKey: ["formato", tipo], queryFn: () => api.formatos(tipo!), enabled: !!tipo });
export const useAsistenteEstado = () =>
  useQuery({ queryKey: ["asistente-estado"], queryFn: api.asistenteEstado });
export const useMedios = (espacioId?: string, clase?: string) =>
  useQuery({
    queryKey: ["medios", espacioId, clase || "todos"],
    queryFn: () => api.medios(espacioId!, clase),
    enabled: !!espacioId,
  });
export const useElementos = (espacioId?: string, clase?: string) =>
  useQuery({
    queryKey: ["elementos", espacioId, clase || "todos"],
    queryFn: () => api.elementos(espacioId!, clase),
    enabled: !!espacioId,
  });
export const useReparto = (proyectoId?: string, clase?: string) =>
  useQuery({
    queryKey: ["reparto", proyectoId, clase || "todos"],
    queryFn: () => api.reparto(proyectoId!, clase),
    enabled: !!proyectoId,
  });
export const useBiblioteca = (espacioId?: string) =>
  useQuery({
    queryKey: ["biblioteca", espacioId],
    queryFn: () => api.biblioteca(espacioId!),
    enabled: !!espacioId,
  });
export const usePiezas = (proyectoId?: string) =>
  useQuery({
    queryKey: ["piezas", proyectoId],
    queryFn: () => api.piezas(proyectoId!),
    enabled: !!proyectoId,
  });
export const useGuion = (piezaId?: string) =>
  useQuery({ queryKey: ["guion", piezaId], queryFn: () => api.guion(piezaId!), enabled: !!piezaId });

export function useCrearEspacio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: Record<string, unknown>) => api.crearEspacio(datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estudio"] });
      qc.invalidateQueries({ queryKey: ["espacios"] });
    },
  });
}

export function useCrearProyecto(espacioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: Record<string, unknown>) => api.crearProyecto(espacioId, datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos", espacioId] });
      qc.invalidateQueries({ queryKey: ["espacio", espacioId] });
      qc.invalidateQueries({ queryKey: ["estudio"] });
    },
  });
}
