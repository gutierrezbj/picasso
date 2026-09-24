import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, IdCard } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import Selector from "../componentes/Selector";
import { useEspacio, useProyectos, useRecorridos, useCrearProyecto } from "../api/hooks";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";
import { NOMBRE_TIPO, NOMBRE_TIPO_ESPACIO } from "../lib/formato";

const FORMATOS = [
  { valor: "16:9", texto: "16:9 · horizontal" },
  { valor: "9:16", texto: "9:16 · vertical" },
  { valor: "1:1", texto: "1:1 · cuadrado" },
  { valor: "4:5", texto: "4:5 · retrato" },
];

function DialogoNuevoProyecto({ abierto, onCerrar, espacioId }) {
  const navegar = useNavigate();
  const { data: recorridos } = useRecorridos();
  const crear = useCrearProyecto(espacioId);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("corto");
  const [formato, setFormato] = useState("16:9");

  const enviar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const proy = await crear.mutateAsync({ nombre: nombre.trim(), tipo, formato_video: formato });
    onCerrar();
    navegar(proy.ultima_ubicacion || `/p/${proy.id}/idea`);
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Nuevo proyecto" data-testid="dialogo-nuevo-proyecto">
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <Campo etiqueta="Nombre" htmlFor="nombre-proyecto">
          <Entrada
            id="nombre-proyecto"
            data-testid="input-nombre-proyecto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Vídeo de invierno…"
            autoFocus
          />
        </Campo>

        <Campo etiqueta="Tipo">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(recorridos || []).map((r) => {
              const sel = tipo === r.tipo;
              return (
                <button
                  key={r.tipo}
                  type="button"
                  data-testid={`opcion-tipo-${r.tipo}`}
                  onClick={() => setTipo(r.tipo)}
                  className={
                    "rounded-card p-4 text-left transition-colors duration-[120ms] ease-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
                    (sel ? "bg-acentoSuave ring-2 ring-acento" : "border border-linea bg-superficie hover:bg-superficie2")
                  }
                >
                  <div className="text-[16px] leading-[24px] font-semibold text-tinta">{r.nombre}</div>
                  <div className="mt-1 text-[13px] leading-[18px] text-tinta2">{r.descripcion}</div>
                </button>
              );
            })}
          </div>
        </Campo>

        <Campo etiqueta="Formato de vídeo">
          <Selector data-testid="select-formato" valor={formato} onChange={setFormato} opciones={FORMATOS} />
        </Campo>

        <div className="flex justify-end gap-3">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" data-testid="btn-crear-proyecto" disabled={!nombre.trim() || crear.isPending}>
            Crear proyecto
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}

function DialogoIdentidad({ abierto, onCerrar, espacio }) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState(espacio.nombre);
  const [notas, setNotas] = useState(espacio.notas_de_marca || "");
  const updatedRef = useRef(espacio.updated_at);

  useEffect(() => {
    setNombre(espacio.nombre);
    setNotas(espacio.notas_de_marca || "");
    updatedRef.current = espacio.updated_at;
    // eslint-disable-next-line
  }, [espacio.id]);

  useAutoguardado(
    { nombre, notas },
    async () => {
      const actualizado = await api.editarEspacio(espacio.id, {
        nombre: nombre.trim() || espacio.nombre,
        notas_de_marca: notas.trim() || null,
        updated_at: updatedRef.current,
      });
      updatedRef.current = actualizado.updated_at;
      qc.setQueryData(["espacio", espacio.id], actualizado);
      qc.invalidateQueries({ queryKey: ["estudio"] });
    },
    { activo: abierto }
  );

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Identidad del espacio" data-testid="dialogo-identidad">
      <div className="flex flex-col gap-6">
        <Campo etiqueta="Nombre" htmlFor="ident-nombre">
          <Entrada
            id="ident-nombre"
            data-testid="input-identidad-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Notas de marca" ayuda="Tono, qué se puede y qué no. Se guarda solo.">
          <AreaTexto
            data-testid="input-identidad-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </Campo>
        <p className="text-[13px] leading-[18px] text-tinta2">
          El logo y la portada llegan con el subsistema de medios (Fase 3).
        </p>
        <div className="flex justify-end">
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
        </div>
      </div>
    </Dialogo>
  );
}

export default function Espacio() {
  const { espacioId } = useParams();
  const navegar = useNavigate();
  const { data: espacio, isLoading } = useEspacio(espacioId);
  const { data: proyectos } = useProyectos(espacioId);
  const [dNuevo, setDNuevo] = useState(false);
  const [dIdent, setDIdent] = useState(false);

  if (isLoading || !espacio) {
    return (
      <div>
        <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: "…" }]} />
        <p className="p-10 text-tinta2">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Cabecera migas={[{ texto: "Estudio", a: "/" }, { texto: espacio.nombre }]} />

      <main className="mx-auto w-full max-w-[1120px] px-6 py-10 md:px-10">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-card bg-acentoSuave text-[22px] font-semibold text-acentoTinta">
              {espacio.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">{espacio.nombre}</h1>
              <p className="mt-1 text-[14px] leading-[20px] text-tinta2">{NOMBRE_TIPO_ESPACIO[espacio.tipo_espacio]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/e/${espacio.id}/biblioteca`} data-testid="acceso-biblioteca">
              <Boton variante="secundario">
                <BookOpen size={18} strokeWidth={1.9} /> Biblioteca
              </Boton>
            </Link>
            <Boton variante="secundario" data-testid="acceso-identidad" onClick={() => setDIdent(true)}>
              <IdCard size={18} strokeWidth={1.9} /> Identidad del espacio
            </Boton>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] leading-[30px] font-semibold text-tinta">Proyectos</h2>
          <Boton data-testid="btn-nuevo-proyecto" onClick={() => setDNuevo(true)}>
            <Plus size={18} strokeWidth={1.9} /> Nuevo proyecto
          </Boton>
        </div>

        {(proyectos || []).length === 0 ? (
          <Tarjeta className="p-10 text-center" data-testid="proyectos-vacio">
            <p className="text-[16px] leading-[24px] text-tinta2">
              Este espacio no tiene proyectos todavía. Crea uno para empezar su recorrido.
            </p>
          </Tarjeta>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {proyectos.map((p) => (
              <button
                key={p.id}
                data-testid={`proyecto-${p.id}`}
                onClick={() => navegar(p.ultima_ubicacion || `/p/${p.id}/idea`)}
                className="flex flex-col gap-3 rounded-card border border-linea bg-superficie p-5 text-left transition-colors duration-[120ms] ease-suave hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[18px] leading-[24px] font-semibold text-tinta">{p.nombre}</span>
                  <span className="rounded-full bg-superficie2 px-3 py-1 text-[13px] leading-[18px] text-tinta2">
                    {NOMBRE_TIPO[p.tipo]}
                  </span>
                </div>
                <span className="text-[14px] leading-[20px] text-tinta2">{p.progreso}</span>
              </button>
            ))}
          </div>
        )}
      </main>

      <DialogoNuevoProyecto abierto={dNuevo} onCerrar={() => setDNuevo(false)} espacioId={espacioId} />
      <DialogoIdentidad abierto={dIdent} onCerrar={() => setDIdent(false)} espacio={espacio} />
    </div>
  );
}
