import React from "react";

// Selector nativo con estilo de token (control.height 44, radius.control 12).
export default function Selector({ valor, onChange, opciones, "data-testid": testid }) {
  return (
    <div className="relative">
      <select
        data-testid={testid}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full appearance-none rounded-control border border-linea bg-superficie px-4 pr-10 text-[16px] leading-[24px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-tinta2">▾</span>
    </div>
  );
}
