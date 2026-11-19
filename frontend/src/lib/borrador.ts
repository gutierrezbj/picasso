export interface AlcanceRestaurado {
  listo: boolean;
  seleccion: string | null;
  aviso: string | null;
}

export function restaurarAlcance(alcance: any, tomas: { id: string; numero?: number }[] | null): AlcanceRestaurado {
  if (alcance?.tipo !== "editar" || !alcance.toma_id) return { listo: true, seleccion: null, aviso: null };
  if (tomas === null) return { listo: false, seleccion: null, aviso: null };
  if (tomas.some((t) => t.id === alcance.toma_id)) return { listo: true, seleccion: alcance.toma_id, aviso: null };
  return { listo: true, seleccion: null, aviso: "La versión que estabas editando ya no está en la carpeta: el alcance vuelve a «Nueva imagen»." };
}

export type AccionReintento = "continuar" | "confirmar" | "pedir" | null;

export function accionReintento(m: { estado: string; bloqueo?: any; presupuesto_id?: string | null }, presupuestoLocal: any): AccionReintento {
  if (m.bloqueo?.activo) return null;
  if (m.estado === "presupuestada" && m.presupuesto_id) return "continuar";
  if (m.estado === "fallida") return presupuestoLocal ? "confirmar" : "pedir";
  return null;
}
