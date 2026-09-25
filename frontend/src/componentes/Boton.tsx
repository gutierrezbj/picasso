import React from "react";

const estilos: Record<string, string> = {
  base:
    "inline-flex items-center justify-center gap-2 rounded-control font-ui font-medium " +
    "transition-colors duration-[120ms] ease-suave disabled:opacity-45 disabled:cursor-not-allowed " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento",
  tamano: "min-h-[44px] px-4 text-[16px] leading-[24px]",
  tamanoPeq: "min-h-[36px] px-3 text-[14px] leading-[20px]",
  primario: "bg-acento text-white hover:bg-acentoTinta",
  secundario: "bg-superficie text-tinta border border-linea hover:bg-superficie2",
  texto: "bg-transparent text-acento hover:bg-acentoSuave px-3",
};

type Variante = "primario" | "secundario" | "texto";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  pequeno?: boolean;
}

export default function Boton({
  children,
  variante = "primario",
  pequeno = false,
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`${estilos.base} ${pequeno ? estilos.tamanoPeq : estilos.tamano} ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
