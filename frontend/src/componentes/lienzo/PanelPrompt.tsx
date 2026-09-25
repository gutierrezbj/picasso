import React, { useEffect, useState } from "react";
import Boton from "../Boton";
import { AreaTexto } from "../Campo";
import { api } from "../../api/cliente";
import type { PromptVista } from "../../tipos";

interface Props {
  planoId: string;
  sello: string; // updated_at del plano: al cambiar, se reconstruye la vista previa
}

// Vista previa del prompt (§8). Se construye en el backend con una plantilla; sin
// llamar a ningún modelo. Editarla a mano la congela hasta reconstruirla.
export default function PanelPrompt({ planoId, sello }: Props) {
  const [vista, setVista] = useState<PromptVista | null>(null);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.prompt(planoId).then((v) => {
      if (!vivo) return;
      setVista(v);
      setTexto(v.texto || "");
      setEditando(false);
    });
    return () => {
      vivo = false;
    };
  }, [planoId, sello]);

  if (!vista) return <p className="text-[13px] text-tinta2">Construyendo la vista previa…</p>;

  return (
    <div data-testid="panel-prompt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] leading-[18px] font-semibold text-tinta">Vista previa del prompt</h3>
        {vista.editado_a_mano && (
          <span data-testid="prompt-editado" className="text-[12px] leading-[16px] text-aviso">
            prompt editado a mano
          </span>
        )}
      </div>

      {editando ? (
        <AreaTexto
          data-testid="prompt-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="mt-2 min-h-[160px] font-mono text-[13px]"
        />
      ) : (
        <pre
          data-testid="prompt-texto-lectura"
          className="mt-2 whitespace-pre-wrap rounded-control border border-linea bg-superficie2 p-3 font-mono text-[12px] leading-[18px] text-tinta"
        >
          {vista.texto || "—"}
        </pre>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {editando ? (
          <>
            <Boton
              pequeno
              data-testid="btn-guardar-prompt"
              onClick={async () => {
                const v = await api.guardarPrompt(planoId, texto);
                setVista(v);
                setEditando(false);
              }}
            >
              Guardar prompt
            </Boton>
            <Boton
              pequeno
              variante="secundario"
              data-testid="btn-cancelar-prompt"
              onClick={() => {
                setTexto(vista.texto || "");
                setEditando(false);
              }}
            >
              Cancelar
            </Boton>
          </>
        ) : (
          <Boton
            pequeno
            variante="secundario"
            data-testid="btn-editar-prompt"
            onClick={() => setEditando(true)}
          >
            Editar a mano
          </Boton>
        )}
        {vista.editado_a_mano && (
          <Boton
            pequeno
            variante="texto"
            data-testid="btn-reconstruir-prompt"
            onClick={async () => {
              const v = await api.reconstruirPrompt(planoId);
              setVista(v);
              setTexto(v.texto || "");
              setEditando(false);
            }}
          >
            Reconstruir desde la dirección
          </Boton>
        )}
      </div>

      <p className="mt-3 text-[12px] leading-[16px] text-tinta2" data-testid="prompt-fichas-usadas">
        Fichas usadas:{" "}
        {vista.fichas_usadas.length === 0
          ? "ninguna"
          : vista.fichas_usadas
              .map((f) => `${f.nombre} v${f.version}${f.aprobada ? "" : " (sin aprobar)"}`)
              .join(" · ")}
      </p>
      <p className="mt-1 text-[12px] leading-[16px] text-tinta3">
        Nunca se piden textos ni rótulos al modelo (§8).
      </p>
    </div>
  );
}
