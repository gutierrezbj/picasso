import React from "react";
import { formatoMoneda, formatoMonedaFino } from "../../lib/formato";
import type { ModeloCatalogo, CosteOperacion } from "../../tipos";

/** Coste estimado en la interfaz (§9.4.2). `null` = «coste sin verificar»:
 * nunca se muestra 0 por desconocido. */
export function costeEstimado(
  modelo: ModeloCatalogo | null,
  datos: { duracion_s?: number | null; texto?: string | null; variantes?: number }
): number | null {
  if (!modelo || modelo.coste.valor === null) return null;
  const valor = Number(modelo.coste.valor);
  const variantes = Math.max(1, datos.variantes || 1);
  if (modelo.coste.unidad === "imagen") return aCentimos(valor * variantes);
  if (modelo.coste.unidad === "segundo") return aCentimos(valor * Number(datos.duracion_s || 0));
  if (modelo.coste.unidad === "caracter") return aCentimos(valor * (datos.texto || "").length);
  return aCentimos(valor * variantes);
}

/** Todo el dinero va en céntimos: lo que se ve es lo que se reserva y se cobra. */
const aCentimos = (n: number): number => Math.round(n * 100) / 100;

export function textoCoste(coste: number | null, moneda: string): string {
  return coste === null ? "coste sin verificar" : formatoMoneda(coste, moneda);
}

export function textoGasto(
  g: { informado: number; estimado: number; reservado: number; posible_cargo: number },
  moneda: string
): string {
  const partes = [
    `${formatoMoneda(g.informado, moneda)} informado`,
    `${formatoMoneda(g.estimado, moneda)} estimado`,
    `${formatoMoneda(g.reservado, moneda)} reservado`,
  ];
  if (g.posible_cargo > 0) partes.push(`${formatoMoneda(g.posible_cargo, moneda)} posible cargo sin confirmar`);
  return partes.join(" · ");
}

export function textoImporte(c: CosteOperacion | undefined, moneda: string): string {
  if (!c) return "—";
  if (c.categoria === "informado" && c.informado !== null) return `${formatoMoneda(c.informado, moneda)} · ${c.etiqueta}`;
  if (c.categoria === "historico_tarifa" && c.contado !== null) return `${formatoMoneda(c.contado, moneda)} · ${c.etiqueta}`;
  if (c.segun_tarifa != null) return `${formatoMonedaFino(c.segun_tarifa, moneda)} según tarifa · sin importe del proveedor`;
  if (c.categoria === "estimado") return "sin importe del proveedor";
  return "—";
}

const CONSUMO: Record<string, string> = { ausente: "sin consumo informado", sin_cuadrar: "consumo sin cuadrar" };

export function lineasIntentoMejora(c: CosteOperacion | undefined, moneda: string): string[] {
  return (c?.intentos_mejora || []).map((it) => {
    const estado = it.estado === "incierta"
      ? "incierta"
      : it.en_curso
        ? "en curso"
      : it.estado_respuesta === "incomplete"
        ? `incompleta${it.motivo ? ` (${it.motivo})` : ""}`
        : it.estado_respuesta === "completed"
          ? "completa"
          : it.estado_respuesta === "rechazada"
            ? "rechazada"
            : it.estado;
    const importe = it.en_curso
      ? `reserva estimada ${formatoMonedaFino(it.reserva, moneda)}`
      : it.estado_consumo === "valido"
        ? `según tarifa ${formatoMonedaFino(it.coste_segun_tarifa, moneda)}`
        : it.estado_consumo
          ? CONSUMO[it.estado_consumo]
          : it.estado === "incierta"
            ? `reserva estimada ${formatoMonedaFino(it.reserva, moneda)}`
            : "sin consumo";
    const tokens = it.tokens && it.estado_consumo === "valido" ? ` · ${it.tokens.entrada} de entrada y ${it.tokens.salida} de salida × tarifa del ${(it.tarifa_aplicada?.verificada_en || "").split("-").reverse().join("-")}` : "";
    return `Intento ${it.numero}: ${estado} · ${importe}${tokens}${it.marcas.length ? ` · ${it.marcas.join("; ")}` : ""}`;
  });
}

export const ETIQUETA_ACCION: Record<string, string> = {
  generar_imagen: "Generar imagen",
  editar_imagen: "Editar imagen",
  imagen_con_referencias: "Imagen con referencias",
  generar_video: "Generar vídeo",
  generar_voz: "Generar voz",
  sincronizar_labios: "Sincronizar labios",
  personaje_hablando: "Personaje hablando",
  mejorar_texto: "Mejorar descripción",
};

export const ETIQUETA_ESTADO: Record<string, string> = {
  preparada: "preparada",
  presupuestada: "presupuestada",
  autorizada: "autorizada",
  enviada: "enviada",
  en_curso: "en curso",
  completada: "completada",
  incierta: "incierta",
  fallida: "fallida",
  descartada: "descartada",
};

export function colorEstado(estado: string): string {
  if (estado === "completada") return "text-tinta";
  if (estado === "fallida") return "text-[var(--color-error,#b42318)]";
  if (estado === "incierta") return "text-aviso";
  return "text-tinta2";
}

interface PropsMedio {
  medio: { id: string; clase: string } | null;
  url: (id: string) => string;
  relacion: string;
  testid?: string;
}

/** Un medio a la vista, siempre entero y sin recortar (§22). */
export function VistaMedio({ medio, url, relacion, testid }: PropsMedio) {
  if (!medio) {
    return (
      <div
        data-testid={testid}
        className="flex items-center justify-center rounded-control bg-superficie2 text-[13px] text-tinta3"
        style={{ aspectRatio: relacion }}
      >
        sin material
      </div>
    );
  }
  if (medio.clase === "video") {
    return (
      <video
        data-testid={testid}
        src={url(medio.id)}
        controls
        className="w-full rounded-control bg-black object-contain"
        style={{ aspectRatio: relacion }}
      />
    );
  }
  if (medio.clase === "audio") {
    return <audio data-testid={testid} src={url(medio.id)} controls className="w-full" />;
  }
  return (
    <img
      data-testid={testid}
      src={url(medio.id)}
      alt="Toma"
      className="w-full rounded-control bg-superficie2 object-contain"
      style={{ aspectRatio: relacion }}
    />
  );
}
