import React, { useRef, useState } from "react";
import { CheckCircle2, FilePlus2, Wrench } from "lucide-react";
import Boton from "./Boton";
import Selector from "./Selector";
import ListaTextos from "./ListaTextos";
import Referencias from "./Referencias";
import { Campo, Entrada, AreaTexto } from "./Campo";
import { api } from "../api/cliente";
import { useAutoguardado } from "../estado/useAutoguardado";
import type { CamposDinamicos, Elemento, FichaVersion, Medio } from "../tipos";

const CLASES_CON_REFERENCIA = ["personaje", "producto"];

const TEXTO_PREPARAR: Record<string, string> = {
  personaje: "Crear hoja de personaje",
  producto: "Crear photobook del producto",
  escenario: "Crear lámina del escenario",
  objeto: "Preparar referencias del objeto",
};

// Ejemplos de rasgo según la clase del elemento (§3.1).
const EJEMPLO_FIJOS: Record<string, string> = {
  personaje: "Cicatriz en la ceja derecha…",
  escenario: "Suelo de baldosa hidráulica…",
  producto: "Logotipo grabado en la tapa…",
  objeto: "Mango de madera astillado…",
};

const EJEMPLO_VARIABLES: Record<string, string> = {
  personaje: "Abrigo de invierno en el mundo nevado…",
  escenario: "De noche, con las persianas bajadas…",
  producto: "Con la tapa abierta o cerrada…",
  objeto: "Mojado tras la lluvia…",
};

// Ficha del elemento seleccionado (§6.2). Una versión aprobada es inmutable:
// editar = crear una versión nueva.
interface PropsFichaElemento {
  elemento: Elemento;
  ficha: FichaVersion;
  versiones: FichaVersion[];
  versionFijada?: number | null;
  ultimaAprobada?: number | null;
  medios: Medio[];
  espacioId: string;
  onElegirVersion?: (version: number) => void;
  onCambiada?: (opciones?: { recargarLista?: boolean }) => void | Promise<unknown>;
  onMediosNuevos?: (medios: Medio[]) => void | Promise<unknown>;
  onActualizarFijada?: (version: number) => void | Promise<unknown>;
  onVersionCreada?: (version: number) => void | Promise<unknown>;
}

export default function FichaElemento({
  elemento,
  ficha,
  versiones,
  versionFijada,
  ultimaAprobada,
  medios,
  espacioId,
  onElegirVersion,
  onCambiada,
  onMediosNuevos,
  onActualizarFijada,
  onVersionCreada,
}: PropsFichaElemento) {
  const editable = ficha.estado === "borrador";
  const [datos, setDatos] = useState<CamposDinamicos>({
    descripcion: ficha.descripcion || "",
    rasgos_fijos: ficha.rasgos_fijos || [],
    rasgos_variables: ficha.rasgos_variables || [],
    referencias: ficha.referencias || [],
    personalidad: ficha.personalidad || "",
    voz: ficha.voz || { proveedor: "", voice_id: "", ajustes: {} },
    materiales_colores: ficha.materiales_colores || "",
    ambiente: ficha.ambiente || "",
    distribucion: ficha.distribucion || "",
    nota_cambio: ficha.nota_cambio || "",
  });
  const [nombre, setNombre] = useState(elemento.nombre);
  const [error, setError] = useState(null);
  const updatedFicha = useRef(ficha.updated_at);
  const updatedElemento = useRef(elemento.updated_at);

  useAutoguardado(
    datos,
    async () => {
      const guardada = await api.editarFicha(ficha.id, {
        ...datos,
        updated_at: updatedFicha.current,
      });
      updatedFicha.current = guardada.updated_at;
      onCambiada?.({ recargarLista: false });
    },
    {
      activo: editable,
      // Conflicto de versión (§12).
      recargar: async () => {
        await onCambiada?.({ recargarLista: true });
      },
      sobrescribir: async () => {
        const el = await api.elemento(elemento.id);
        const fresca = el.fichas.find((f) => f.id === ficha.id);
        const guardada = await api.editarFicha(ficha.id, {
          ...datos,
          updated_at: fresca?.updated_at,
        });
        updatedFicha.current = guardada.updated_at;
        await onCambiada?.({ recargarLista: true });
      },
    }
  );

  useAutoguardado(
    nombre,
    async () => {
      if (!nombre.trim() || nombre === elemento.nombre) return;
      const guardado = await api.editarElemento(elemento.id, {
        nombre,
        updated_at: updatedElemento.current,
      });
      updatedElemento.current = guardado.updated_at;
      onCambiada?.({ recargarLista: true });
    },
    { activo: true }
  );

  const set = (k: string, v: any) => setDatos((d) => ({ ...d, [k]: v }));

  const accion = async (fn: any) => {
    setError(null);
    try {
      await fn();
      onCambiada?.({ recargarLista: true });
    } catch (e) {
      setError(e.message);
    }
  };

  const hayVersionNueva = ultimaAprobada && versionFijada && ultimaAprobada > versionFijada;

  // §4.3 (decisión del usuario): personajes y productos necesitan al menos una imagen
  // de referencia para poder aprobar la versión. Escenarios y objetos no lo exigen.
  const exigeReferencia = CLASES_CON_REFERENCIA.includes(elemento.clase);
  const faltan = [];
  if (!datos.descripcion.trim()) faltan.push("escribe la descripción");
  if (exigeReferencia && datos.referencias.length === 0)
    faltan.push("añade al menos una imagen de referencia");
  const faltaParaAprobar = faltan.length
    ? `Para aprobar la versión, ${faltan.join(" y ")}.`
    : null;

  return (
    <section className="flex flex-col gap-6" data-testid="ficha-elemento">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Campo etiqueta="Nombre del elemento" htmlFor="ficha-nombre">
            <Entrada
              id="ficha-nombre"
              data-testid="input-nombre-elemento"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Campo>
        </div>
        <div className="w-[200px]">
          <Campo etiqueta="Versión de la ficha">
            <Selector
              data-testid="select-version-ficha"
              valor={String(ficha.version)}
              onChange={(v) => onElegirVersion(Number(v))}
              opciones={versiones.map((f) => ({
                valor: String(f.version),
                texto: `v${f.version} · ${f.estado === "aprobada" ? "aprobada" : "borrador"}`,
              }))}
            />
          </Campo>
        </div>
      </div>

      <div className="rounded-card border border-linea bg-superficie2 px-4 py-3">
        <p className="text-[13px] leading-[18px] text-tinta2" data-testid="info-version-fijada">
          {versionFijada
            ? `Este proyecto usa la v${versionFijada} de la ficha.`
            : "Este elemento no está en el reparto del proyecto."}
        </p>
        {hayVersionNueva && (
          <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="aviso-version-nueva">
            <span className="text-[14px] leading-[20px] text-tinta">
              Hay versión v{ultimaAprobada}.
            </span>
            <Boton
              pequeno
              data-testid="btn-actualizar-version"
              onClick={() => accion(() => onActualizarFijada(ultimaAprobada))}
            >
              Actualizar a v{ultimaAprobada}
            </Boton>
            <span className="text-[13px] leading-[18px] text-tinta2">
              El análisis de impacto de este cambio (§13) se construye en la Fase 8.
            </span>
          </div>
        )}
      </div>

      {!editable && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-card border border-linea bg-superficie px-4 py-3"
          data-testid="aviso-ficha-aprobada"
        >
          <span className="flex items-center gap-2 text-[14px] leading-[20px] text-exito">
            <CheckCircle2 size={18} strokeWidth={1.9} /> v{ficha.version} aprobada y congelada.
          </span>
          <span className="text-[13px] leading-[18px] text-tinta2">
            Para cambiarla hay que crear una versión nueva.
          </span>
          <Boton
            pequeno
            variante="secundario"
            data-testid="btn-crear-version"
            onClick={() =>
              accion(async () => {
                const nueva = await api.crearVersionFicha(elemento.id);
                onVersionCreada?.(nueva.version);
              })
            }
          >
            <FilePlus2 size={16} strokeWidth={1.9} /> Crear versión nueva
          </Boton>
        </div>
      )}

      <Campo etiqueta="Descripción" ayuda="Qué es y qué identifica a este elemento." htmlFor="ficha-descripcion">
        {editable ? (
          <AreaTexto
            id="ficha-descripcion"
            data-testid="campo-descripcion"
            value={datos.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
          />
        ) : (
          <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta" data-testid="campo-descripcion">
            {datos.descripcion || "— vacío —"}
          </p>
        )}
      </Campo>

      <Campo etiqueta="Rasgos fijos" ayuda="Lo que nunca debe cambiar.">
        <ListaTextos
          testid="rasgos-fijos"
          valores={datos.rasgos_fijos}
          editable={editable}
          placeholder={EJEMPLO_FIJOS[elemento.clase] || EJEMPLO_FIJOS.personaje}
          onCambiar={(v) => set("rasgos_fijos", v)}
        />
      </Campo>

      <Campo etiqueta="Rasgos variables" ayuda="Lo que puede cambiar según el contexto (vestuario, mundo…).">
        <ListaTextos
          testid="rasgos-variables"
          valores={datos.rasgos_variables}
          editable={editable}
          placeholder={EJEMPLO_VARIABLES[elemento.clase] || EJEMPLO_VARIABLES.personaje}
          onCambiar={(v) => set("rasgos_variables", v)}
        />
      </Campo>

      {elemento.clase === "personaje" && (
        <>
          <Campo etiqueta="Personalidad" htmlFor="ficha-personalidad">
            {editable ? (
              <AreaTexto
                id="ficha-personalidad"
                data-testid="campo-personalidad"
                value={datos.personalidad}
                onChange={(e) => set("personalidad", e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                {datos.personalidad || "— vacío —"}
              </p>
            )}
          </Campo>
          <Campo etiqueta="Voz" ayuda="El catálogo de voces llega con los proveedores reales (Fase 9).">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Entrada
                data-testid="campo-voz-proveedor"
                placeholder="Proveedor"
                disabled={!editable}
                value={datos.voz?.proveedor || ""}
                onChange={(e) => set("voz", { ...datos.voz, proveedor: e.target.value })}
              />
              <Entrada
                data-testid="campo-voz-id"
                placeholder="Identificador de voz"
                disabled={!editable}
                value={datos.voz?.voice_id || ""}
                onChange={(e) => set("voz", { ...datos.voz, voice_id: e.target.value })}
              />
            </div>
          </Campo>
        </>
      )}

      {elemento.clase === "producto" && (
        <Campo etiqueta="Materiales y colores" ayuda="Detalles que no se reinterpretan." htmlFor="ficha-materiales">
          {editable ? (
            <AreaTexto
              id="ficha-materiales"
              data-testid="campo-materiales"
              value={datos.materiales_colores}
              onChange={(e) => set("materiales_colores", e.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
              {datos.materiales_colores || "— vacío —"}
            </p>
          )}
        </Campo>
      )}

      {elemento.clase === "escenario" && (
        <>
          <Campo etiqueta="Ambiente" htmlFor="ficha-ambiente">
            {editable ? (
              <AreaTexto
                id="ficha-ambiente"
                data-testid="campo-ambiente"
                value={datos.ambiente}
                onChange={(e) => set("ambiente", e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                {datos.ambiente || "— vacío —"}
              </p>
            )}
          </Campo>
          <Campo etiqueta="Distribución" htmlFor="ficha-distribucion">
            {editable ? (
              <AreaTexto
                id="ficha-distribucion"
                data-testid="campo-distribucion"
                value={datos.distribucion}
                onChange={(e) => set("distribucion", e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-[16px] leading-[24px] text-tinta">
                {datos.distribucion || "— vacío —"}
              </p>
            )}
          </Campo>
        </>
      )}

      <Campo
        etiqueta="Referencias"
        ayuda={
          exigeReferencia
            ? "Imágenes del espacio que fijan el aspecto. Hace falta al menos una para aprobar la versión."
            : "Imágenes del espacio que fijan el aspecto de este elemento."
        }
      >
        <Referencias
          referencias={datos.referencias}
          medios={medios}
          editable={editable}
          espacioId={espacioId}
          clase={elemento.clase}
          onCambiar={(v: any) => set("referencias", v)}
          onMediosNuevos={onMediosNuevos}
        />
      </Campo>

      <div className="rounded-card border border-linea bg-superficie2 p-4">
        <div className="text-[14px] leading-[20px] font-medium text-tinta">Preparar referencias</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Boton pequeno variante="secundario" data-testid="btn-preparar-referencias" disabled>
            <Wrench size={16} strokeWidth={1.9} />{" "}
            {TEXTO_PREPARAR[elemento.clase] || "Preparar referencias"}
          </Boton>
          <span className="text-[13px] leading-[18px] text-tinta2">
            No entra en el alcance acordado de la Fase 6: queda pendiente de decidir cuándo se
            construye.
          </span>
        </div>
      </div>

      {editable && (
        <Campo etiqueta="Nota de cambio" ayuda="Por qué existe esta versión." htmlFor="ficha-nota">
          <Entrada
            id="ficha-nota"
            data-testid="campo-nota-cambio"
            value={datos.nota_cambio}
            onChange={(e) => set("nota_cambio", e.target.value)}
          />
        </Campo>
      )}

      {error && (
        <p className="text-[14px] leading-[20px] text-error" data-testid="error-ficha">
          {error}
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Boton data-testid="btn-aprobar-ficha" disabled={!!faltaParaAprobar} onClick={() => accion(() => api.aprobarFicha(ficha.id))}>
            Aprobar versión
          </Boton>
          <span className="text-[13px] leading-[18px] text-tinta2" data-testid="aviso-aprobar">
            {faltaParaAprobar || "Al aprobarla queda congelada; es la que usará la producción."}
          </span>
        </div>
      )}
    </section>
  );
}
