import React from "react";

// Selector nativo con estilo de token (control.height 44, radius.control 12).
interface Opcion {
  valor: string;
  texto: string;
}

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  opciones: Opcion[];
  "data-testid"?: string;
  compacto?: boolean;
}

export default function Selector({ valor, onChange, opciones, "data-testid": testid, compacto }: Props) {
  return (
    <div className="relative">
      <select
        data-testid={testid}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={
          "min-h-[44px] w-full appearance-none rounded-control border border-linea bg-superficie text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
          (compacto ? "px-3 pr-7 text-[14px] leading-[20px]" : "px-4 pr-10 text-[16px] leading-[24px]")
        }
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <span className={"pointer-events-none absolute top-1/2 " + (compacto ? "right-3" : "right-4") + " -translate-y-1/2 text-tinta2"}>▾</span>
    </div>
  );
}
