import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import Boton from "./Boton";
import { api } from "../api/cliente";

// Subida de medios al espacio (§15.1). Un fichero cada vez, con progreso y error
// por fichero. El original nunca se modifica: cada subida es un Medio nuevo.
export default function SubidorMedios({
  espacioId,
  acepta = "image/*",
  texto = "Subir archivo",
  onSubido,
  testid = "subir-medio",
}) {
  const entrada = useRef(null);
  const [cola, setCola] = useState([]); // {nombre, pct, error}
  const [ocupado, setOcupado] = useState(false);

  const elegir = async (e) => {
    const archivos: File[] = Array.from(e.target.files || []);
    e.target.value = "";
    if (!archivos.length) return;
    setOcupado(true);
    setCola(archivos.map((a) => ({ nombre: a.name, pct: 0, error: null })));
    const creados = [];
    for (let i = 0; i < archivos.length; i += 1) {
      try {
        const medio = await api.subirMedioConProgreso(espacioId, archivos[i], (pct) =>
          setCola((c) => c.map((x, j) => (j === i ? { ...x, pct } : x)))
        );
        creados.push(medio);
        setCola((c) => c.map((x, j) => (j === i ? { ...x, pct: 100 } : x)));
      } catch (err) {
        setCola((c) => c.map((x, j) => (j === i ? { ...x, error: err.message } : x)));
      }
    }
    setOcupado(false);
    if (creados.length) onSubido?.(creados);
    setTimeout(() => setCola((c) => c.filter((x) => x.error)), 1200);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={entrada}
        type="file"
        accept={acepta}
        multiple
        className="hidden"
        data-testid={`${testid}-input`}
        onChange={elegir}
      />
      <Boton
        pequeno
        variante="secundario"
        data-testid={testid}
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
      >
        <Upload size={16} strokeWidth={1.9} /> {texto}
      </Boton>
      {cola.length > 0 && (
        <ul className="flex flex-col gap-1" data-testid={`${testid}-progreso`}>
          {cola.map((x, i) => (
            <li key={i} className="text-[13px] leading-[18px]">
              {x.error ? (
                <span className="text-error">
                  {x.nombre}: {x.error}
                </span>
              ) : (
                <span className="text-tinta2">
                  {x.nombre} · {x.pct === 100 ? "subido" : `subiendo ${x.pct}%`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
