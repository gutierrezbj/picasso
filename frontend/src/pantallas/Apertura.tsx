import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play } from "lucide-react";
import Cabecera from "../componentes/Cabecera";
import Tarjeta from "../componentes/Tarjeta";
import Boton from "../componentes/Boton";
import Dialogo from "../componentes/Dialogo";
import { Campo, Entrada, AreaTexto } from "../componentes/Campo";
import Selector from "../componentes/Selector";
import { useEstudio, useCrearEspacio } from "../api/hooks";
import { api } from "../api/cliente";
import { NOMBRE_TIPO, NOMBRE_TIPO_ESPACIO } from "../lib/formato";

function Inicial({ espacio }) {
  const medioId = espacio.portada_id || espacio.logo_id;
  const letra = (espacio.nombre || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-card bg-acentoSuave text-[22px] font-semibold text-acentoTinta">
      {medioId ? (
        <img
          src={api.urlMedio(medioId)}
          alt=""
          className="h-full w-full object-cover"
          data-testid={`portada-${espacio.id}`}
        />
      ) : (
        letra
      )}
    </div>
  );
}

function DialogoNuevoEspacio({ abierto, onCerrar }) {
  const navegar = useNavigate();
  const crear = useCrearEspacio();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("cliente");
  const [notas, setNotas] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError(null);
    setOcupado(true);
    try {
      const esp = await crear.mutateAsync({
        nombre: nombre.trim(),
        tipo_espacio: tipo,
        notas_de_marca: notas.trim() || null,
      });
      if (archivo) {
        const medio = await api.subirMedio(esp.id, archivo);
        await api.editarEspacio(esp.id, { portada_id: medio.id, updated_at: esp.updated_at });
      }
      onCerrar();
      navegar(`/e/${esp.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Nuevo espacio" data-testid="dialogo-nuevo-espacio">
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <Campo etiqueta="Nombre" htmlFor="nombre-espacio">
          <Entrada
            id="nombre-espacio"
            data-testid="input-nombre-espacio"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cliente A, Mi marca, Trabajo propio…"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Tipo">
          <Selector
            data-testid="select-tipo-espacio"
            valor={tipo}
            onChange={setTipo}
            opciones={[
              { valor: "cliente", texto: "Cliente" },
              { valor: "marca", texto: "Marca" },
              { valor: "propio", texto: "Trabajo propio" },
            ]}
          />
        </Campo>
        <Campo etiqueta="Portada o logo (opcional)" ayuda="Una imagen para reconocer el espacio.">
          <input
            type="file"
            accept="image/*"
            data-testid="input-portada-espacio"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            className="text-[14px] leading-[20px] text-tinta2"
          />
        </Campo>
        <Campo etiqueta="Notas de marca (opcional)" ayuda="Tono, qué se puede y qué no.">
          <AreaTexto
            data-testid="input-notas-espacio"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </Campo>
        {error && (
          <p className="text-[14px] leading-[20px] text-error" data-testid="error-nuevo-espacio">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" data-testid="btn-crear-espacio" disabled={!nombre.trim() || ocupado}>
            Crear espacio
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}

export default function Apertura() {
  const navegar = useNavigate();
  const { data, isLoading } = useEstudio();
  const [dialogo, setDialogo] = useState(false);

  const retomar = data?.retomar;
  const recientes = data?.recientes || [];
  const espacios = data?.espacios || [];
  const hayEspacios = espacios.length > 0;

  return (
    <div className="min-h-full">
      <Cabecera migas={[{ texto: "Estudio" }]} />

      <main className="mx-auto w-full max-w-[1120px] px-6 py-12 md:px-10">
        <header className="mb-12">
          <h1 className="text-[30px] leading-[38px] font-semibold text-tinta">Tu estudio</h1>
          <p className="mt-2 text-[16px] leading-[24px] text-tinta2">
            Sitúate, elige dónde trabajar o retoma donde lo dejaste.
          </p>
        </header>

        {isLoading && <p className="text-tinta2">Cargando…</p>}

        {!isLoading && !hayEspacios && !retomar && (
          <Tarjeta className="p-10 text-center" data-testid="bienvenida-vacia">
            <p className="text-[22px] leading-[30px] font-medium text-tinta">Bienvenido</p>
            <p className="mx-auto mt-3 max-w-[52ch] text-[16px] leading-[24px] text-tinta2">
              Todavía no tienes ningún espacio. Un espacio es el ámbito de un cliente, una marca
              o tu trabajo propio.
            </p>
            <div className="mt-6 flex justify-center">
              <Boton data-testid="btn-primer-espacio" onClick={() => setDialogo(true)}>
                <Plus size={18} strokeWidth={1.9} /> Crear tu primer espacio
              </Boton>
            </div>
          </Tarjeta>
        )}

        {/* 1 · ¿Dónde lo dejé? */}
        {retomar && (
          <section className="mb-12">
            <button
              data-testid="tarjeta-retomar"
              onClick={() => navegar(retomar.ultima_ubicacion || `/p/${retomar.proyecto_id}/idea`)}
              className="group w-full rounded-panel bg-superficie p-8 text-left shadow-card transition-[box-shadow,transform] duration-[180ms] ease-suave hover:shadow-context focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
            >
              <div className="flex items-center gap-2 text-[13px] leading-[18px] font-medium text-acento">
                <Play size={15} strokeWidth={2.2} /> Retomar
              </div>
              <div className="mt-3 text-[22px] leading-[30px] font-semibold text-tinta">
                {retomar.espacio_nombre} · {retomar.proyecto_nombre}
              </div>
              <div className="mt-2 text-[16px] leading-[24px] text-tinta2">{retomar.progreso}</div>
              {retomar.falta && (
                <div className="mt-1 text-[14px] leading-[20px] text-tinta2">Falta: {retomar.falta}</div>
              )}
            </button>

            {recientes.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {recientes.map((r) => (
                  <button
                    key={r.proyecto_id}
                    data-testid={`reciente-${r.proyecto_id}`}
                    onClick={() => navegar(r.ultima_ubicacion || `/p/${r.proyecto_id}/idea`)}
                    className="rounded-card border border-linea bg-superficie p-4 text-left transition-colors duration-[120ms] ease-suave hover:bg-superficie2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                  >
                    <div className="text-[14px] leading-[20px] font-medium text-tinta">{r.proyecto_nombre}</div>
                    <div className="mt-1 text-[13px] leading-[18px] text-tinta2">{r.espacio_nombre}</div>
                    <div className="mt-1 text-[13px] leading-[18px] text-tinta2">{r.progreso}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2 · ¿Dónde trabajo? + 3 · ¿Algo nuevo? */}
        {(hayEspacios || retomar) && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[22px] leading-[30px] font-semibold text-tinta">Espacios</h2>
              <Boton data-testid="btn-nuevo-espacio" onClick={() => setDialogo(true)}>
                <Plus size={18} strokeWidth={1.9} /> Nuevo espacio
              </Boton>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {espacios.map((e) => (
                <button
                  key={e.id}
                  data-testid={`espacio-${e.id}`}
                  onClick={() => navegar(`/e/${e.id}`)}
                  className="flex flex-col gap-4 rounded-panel bg-superficie p-6 text-left shadow-card transition-[box-shadow] duration-[180ms] ease-suave hover:shadow-context focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
                >
                  <div className="flex items-center gap-4">
                    <Inicial espacio={e} />
                    <div className="min-w-0">
                      <div className="truncate text-[18px] leading-[24px] font-semibold text-tinta">{e.nombre}</div>
                      <div className="text-[14px] leading-[20px] text-tinta2">{NOMBRE_TIPO_ESPACIO[e.tipo_espacio]}</div>
                    </div>
                  </div>
                  <div className="text-[14px] leading-[20px] text-tinta2">
                    {e.num_proyectos} {e.num_proyectos === 1 ? "proyecto" : "proyectos"}
                    {e.num_en_curso > 0 && ` · ${e.num_en_curso} en curso`}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <DialogoNuevoEspacio abierto={dialogo} onCerrar={() => setDialogo(false)} />
    </div>
  );
}

export { NOMBRE_TIPO };
