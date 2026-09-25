import React from "react";
import Dialogo from "./Dialogo";
import Boton from "./Boton";

interface PropsConfirmar {
  abierto: boolean;
  titulo: string;
  mensaje: React.ReactNode;
  etiquetaConfirmar: string;
  onConfirmar: () => void | Promise<unknown>;
  onCerrar: () => void;
  testid?: string;
}

// Confirmación de una acción que pierde trabajo (§12: nada se pierde en silencio).
export default function DialogoConfirmar({
  abierto,
  titulo,
  mensaje,
  etiquetaConfirmar,
  onConfirmar,
  onCerrar,
  testid = "dialogo-confirmar",
}: PropsConfirmar) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo={titulo} ancho="max-w-[480px]" data-testid={testid}>
      <p className="text-[16px] leading-[24px] text-tinta">{mensaje}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Boton data-testid="btn-confirmar-accion" onClick={onConfirmar}>
          {etiquetaConfirmar}
        </Boton>
        <Boton data-testid="btn-cancelar-accion" variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
      </div>
    </Dialogo>
  );
}
