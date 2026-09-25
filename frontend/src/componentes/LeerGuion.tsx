import React from "react";
import Dialogo from "./Dialogo";
import Boton from "./Boton";

// Vista «Leer guion completo» (§6.3): el guion como documento continuo, solo lectura.
export default function LeerGuion({ abierto, onCerrar, pieza, escenas, reparto }) {
  const nombre = (elementoId) =>
    reparto.find((r) => r.elemento_id === elementoId)?.elemento.nombre || "Elemento fuera del reparto";
  const nombreEntrada = (entradaId) =>
    reparto.find((r) => r.id === entradaId)?.elemento.nombre || "Elemento fuera del reparto";

  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="max-w-[840px]"
      titulo={pieza?.titulo ? `Leer guion · ${pieza.titulo}` : "Leer guion completo"}
      data-testid="leer-guion"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2" data-testid="leer-guion-cuerpo">
        {escenas.length === 0 ? (
          <p className="text-[16px] leading-[24px] text-tinta2">Todavía no hay escenas.</p>
        ) : (
          escenas.map((e) => (
            <article key={e.id} className="mb-10" data-testid={`leer-escena-${e.orden}`}>
              <h3 className="text-[18px] leading-[24px] font-semibold text-tinta">
                {e.orden}. {e.titulo || "Escena sin título"}
                {e.duracion_orientativa_s ? (
                  <span className="ml-3 font-mono text-[13px] font-normal text-tinta2">
                    ~{e.duracion_orientativa_s} s
                  </span>
                ) : null}
              </h3>
              {e.elementos.length > 0 && (
                <p className="mt-2 text-[13px] leading-[18px] text-tinta2">
                  {e.elementos.map(nombreEntrada).join(" · ")}
                </p>
              )}
              {e.que_ocurre && (
                <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                  {e.que_ocurre}
                </p>
              )}
              {e.que_se_ve && (
                <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[24px] text-tinta2">
                  {e.que_se_ve}
                </p>
              )}
              {e.dialogos.length > 0 && (
                <dl className="mt-4 border-l-2 border-linea pl-4">
                  {e.dialogos.map((d, i) => (
                    <div key={i} className="mb-2">
                      <dt className="text-[13px] leading-[18px] font-semibold uppercase tracking-wide text-tinta2">
                        {d.hablante === "narrador" ? "Narrador" : nombre(d.hablante)}
                      </dt>
                      <dd className="text-[16px] leading-[24px] text-tinta">{d.texto}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {e.sonido_previsto && (
                <p className="mt-3 text-[14px] leading-[20px] text-tinta2">
                  Sonido: {e.sonido_previsto}
                </p>
              )}
            </article>
          ))
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <Boton variante="secundario" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
    </Dialogo>
  );
}
