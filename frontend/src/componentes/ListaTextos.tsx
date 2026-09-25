import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Entrada } from "./Campo";
import Boton from "./Boton";

// Lista de textos cortos (rasgos fijos / variables de una ficha).
export default function ListaTextos({ valores = [], onCambiar, editable = true, testid, placeholder }) {
  const [nuevo, setNuevo] = useState("");

  const anadir = () => {
    const t = nuevo.trim();
    if (!t) return;
    onCambiar([...valores, t]);
    setNuevo("");
  };

  return (
    <div className="flex flex-col gap-2" data-testid={testid}>
      {valores.length === 0 && !editable && (
        <span className="text-[14px] text-tinta3">— sin rasgos —</span>
      )}
      {valores.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 rounded-control bg-superficie2 px-3 py-2 text-[14px] leading-[20px] text-tinta">
            {v}
          </span>
          {editable && (
            <button
              data-testid={`${testid}-quitar-${i}`}
              aria-label={`Quitar «${v}»`}
              onClick={() => onCambiar(valores.filter((_, j) => j !== i))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-tinta2 hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <X size={16} strokeWidth={1.9} />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <div className="flex gap-2">
          <Entrada
            data-testid={`${testid}-nuevo`}
            value={nuevo}
            placeholder={placeholder}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                anadir();
              }
            }}
          />
          <Boton pequeno variante="secundario" data-testid={`${testid}-anadir`} onClick={anadir}>
            <Plus size={16} strokeWidth={1.9} /> Añadir
          </Boton>
        </div>
      )}
    </div>
  );
}
