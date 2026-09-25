import React, { useState } from "react";
import Dialogo from "./Dialogo";
import Boton from "./Boton";
import Selector from "./Selector";
import SubidorMedios from "./SubidorMedios";
import { Campo, Entrada, AreaTexto } from "./Campo";
import { api } from "../api/cliente";
import type { Medio } from "../tipos";

const CLASES = [
  { valor: "personaje", texto: "Personaje" },
  { valor: "objeto", texto: "Objeto" },
  { valor: "producto", texto: "Producto" },
  { valor: "escenario", texto: "Escenario" },
];

const EXIGE_REFERENCIA: string[] = ["personaje", "producto"];

// §4.2: desde el guion se puede crear un elemento que falta sin salir. Se abre la
// ficha en un panel, se aprueba y se vuelve a la escena donde se estaba.
interface Props {
  abierto: boolean;
  onCerrar: () => void;
  espacioId: string;
  proyectoId?: string;
  onCreado?: (entrada?: unknown) => void | Promise<unknown>;
}

export default function PanelElementoNuevo({ abierto, onCerrar, espacioId, proyectoId, onCreado }: Props) {
  const [clase, setClase] = useState("personaje");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [medios, setMedios] = useState<Medio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const exige = EXIGE_REFERENCIA.includes(clase);
  const faltan: string[] = [];
  if (!nombre.trim()) faltan.push("pon un nombre");
  if (!descripcion.trim()) faltan.push("escribe la descripción");
  if (exige && medios.length === 0) faltan.push("sube al menos una imagen de referencia");

  const limpiar = () => {
    setNombre("");
    setDescripcion("");
    setMedios([]);
    setError(null);
  };

  const crear = async () => {
    setError(null);
    setOcupado(true);
    try {
      const el = await api.crearElemento(espacioId, { clase, nombre: nombre.trim() });
      const ficha = el.fichas[0];
      await api.editarFicha(ficha.id, {
        descripcion: descripcion.trim(),
        referencias: medios.map((m) => ({ medio_id: m.id, rol: "otra" })),
        updated_at: ficha.updated_at,
      });
      await api.aprobarFicha(ficha.id);
      const entrada = await api.anadirAlReparto(proyectoId, { elemento_id: el.id });
      limpiar();
      onCreado?.(entrada);
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Crear un elemento que falta"
      data-testid="panel-elemento-nuevo"
    >
      <div className="flex flex-col gap-6">
        <p className="text-[14px] leading-[20px] text-tinta2">
          Se crea en el espacio, se aprueba su ficha v1 y entra en el reparto de este proyecto.
          Vuelves a la escena donde estabas.
        </p>
        <Campo etiqueta="Clase">
          <Selector data-testid="nuevo-elemento-clase" valor={clase} onChange={setClase} opciones={CLASES} />
        </Campo>
        <Campo etiqueta="Nombre" htmlFor="nuevo-elemento-nombre">
          <Entrada
            id="nuevo-elemento-nombre"
            data-testid="nuevo-elemento-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Descripción" ayuda="Qué es y qué lo identifica.">
          <AreaTexto
            data-testid="nuevo-elemento-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Campo>
        <Campo
          etiqueta="Referencias"
          ayuda={
            exige
              ? "Hace falta al menos una imagen para aprobar la ficha de un personaje o un producto."
              : "Opcional en escenarios y objetos."
          }
        >
          <div className="flex flex-col gap-2">
            <SubidorMedios
              espacioId={espacioId}
              acepta="image/*"
              texto="Subir referencia"
              testid="nuevo-elemento-referencia"
              onSubido={(creados) => setMedios((m) => [...m, ...creados])}
            />
            {medios.length > 0 && (
              <ul className="flex flex-wrap gap-2" data-testid="nuevo-elemento-referencias">
                {medios.map((m) => (
                  <li key={m.id} className="h-16 w-16 overflow-hidden rounded-control bg-superficie2">
                    <img src={api.urlMedio(m.id)} alt="" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Campo>
        {error && (
          <p className="text-[14px] leading-[20px] text-error" data-testid="error-elemento-nuevo">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {faltan.length > 0 && (
            <span className="text-[13px] leading-[18px] text-tinta2" data-testid="aviso-elemento-nuevo">
              Para crearlo, {faltan.join(" y ")}.
            </span>
          )}
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            data-testid="btn-crear-elemento-desde-guion"
            disabled={faltan.length > 0 || ocupado}
            onClick={crear}
          >
            Crear y aprobar
          </Boton>
        </div>
      </div>
    </Dialogo>
  );
}
