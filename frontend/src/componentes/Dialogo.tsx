import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Dialogo({ abierto, onCerrar, titulo, children, ancho = "max-w-[540px]", "data-testid": testid }) {
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-tinta/25 px-4 py-10 overflow-auto"
      onMouseDown={onCerrar}
    >
      <div
        data-testid={testid}
        className={`w-full ${ancho} rounded-panel bg-superficie shadow-context p-8`}
        style={{ animation: "aparece var(--motion-context) var(--motion-easing)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-[22px] leading-[30px] font-semibold text-tinta">{titulo}</h2>
          <button
            data-testid="cerrar-dialogo"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes aparece{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
