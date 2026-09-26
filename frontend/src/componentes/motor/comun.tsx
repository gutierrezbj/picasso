import React from "react";
import { formatoMoneda } from "../../lib/formato";
import type { ModeloCatalogo } from "../../tipos";

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

export const ETIQUETA_ACCION: Record<string, string> = {
  generar_imagen: "Generar imagen",
  editar_imagen: "Editar imagen",
  imagen_con_referencias: "Imagen con referencias",
  generar_video: "Generar vídeo",
  generar_voz: "Generar voz",
  sincronizar_labios: "Sincronizar labios",
  personaje_hablando: "Personaje hablando",
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
