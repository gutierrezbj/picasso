export type TrasError = "rechazada" | "presupuesto" | "incierta";

export function trasError(status: number | null, mensaje: string): TrasError {
  if (status === 409 && /presupuesto/i.test(mensaje)) return "presupuesto";
  if (status !== null && status >= 400 && status < 500 && status !== 408 && status !== 429) return "rechazada";
  return "incierta";
}
