import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeMouseHandler,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link } from "react-router-dom";
import { LayoutGrid, Link2, Link2Off, FileText } from "lucide-react";
import Boton from "../Boton";
import DialogoConfirmar from "../DialogoConfirmar";
import FichaContextual from "./FichaContextual";
import FichaPlano from "./FichaPlano";
import FichaElementoLectura from "./FichaElementoLectura";
import GuionGrafico from "./GuionGrafico";
import NodoElemento from "./NodoElemento";
import NodoEscena from "./NodoEscena";
import NodoPlano from "./NodoPlano";
import { ContextoLienzo, type AccionesLienzo } from "./contexto";
import {
  ANCHO_ELEMENTO,
  ANCHO_PLANO,
  construirConexiones,
  construirNodos,
  idPlano,
  type NodoLienzo,
} from "../../lib/lienzo";
import { api } from "../../api/cliente";
import type { LayoutLienzo, OpcionesDireccion, Plano, VistaLienzo } from "../../tipos";

interface Props {
  vista: VistaLienzo;
  opciones: OpcionesDireccion;
  proyectoId: string;
  rutaGuion: string;
  rutaDePaso: (clase: string) => string | null;
  onCambiado: () => Promise<unknown>;
}

const tiposNodo = { elemento: NodoElemento, escena: NodoEscena, plano: NodoPlano };

export default function SuperficieLienzo(props: Props) {
  return (
    <ReactFlowProvider>
      <Superficie {...props} />
    </ReactFlowProvider>
  );
}

function Superficie({ vista, opciones, proyectoId, rutaGuion, rutaDePaso, onCambiado }: Props) {
  const { flowToScreenPosition } = useReactFlow();
  const [layout, setLayout] = useState<LayoutLienzo>(vista.layout);
  const [seleccion, setSeleccion] = useState<string[]>(vista.layout.seleccion || []);
  const [ficha, setFicha] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<number | null>(null);
  const [recolocar, setRecolocar] = useState(false);
  const [nodos, setNodos, onNodosChange] = useNodesState<NodoLienzo>([]);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardar = useCallback(
    (parcial: Partial<LayoutLienzo>) => {
      setLayout((previo) => {
        const nuevo = { ...previo, ...parcial };
        if (temporizador.current) clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => {
          api.guardarLayout(proyectoId, nuevo).catch(() => {});
        }, 500);
        return nuevo;
      });
    },
    [proyectoId]
  );

  const clave = JSON.stringify([
    vista.escenas.map((e) => [e.escena.id, e.planos.map((p) => [p.id, p.updated_at])]),
    vista.reparto.map((r) => r.id),
    layout.posiciones,
    layout.grupos_plegados,
    seleccion,
  ]);

  useEffect(() => {
    setNodos(construirNodos(vista, layout, seleccion));
    // eslint-disable-next-line
  }, [clave]);

  const conexiones = useMemo(() => construirConexiones(vista, layout), [vista, layout]);

  const planos: Plano[] = useMemo(
    () => vista.escenas.flatMap((e) => e.planos).concat(vista.planos_sin_escena),
    [vista]
  );

  const etiquetaDe = (planoId: string): string => {
    for (let n = 0; n < vista.escenas.length; n += 1) {
      const i = vista.escenas[n].planos.findIndex((p) => p.id === planoId);
      if (i >= 0) return `E${n + 1}·P${i + 1}`;
    }
    return "P";
  };

  const acciones: AccionesLienzo = {
    plegados: layout.grupos_plegados,
    alternarPlegado: (escenaId) =>
      guardar({
        grupos_plegados: layout.grupos_plegados.includes(escenaId)
          ? layout.grupos_plegados.filter((x) => x !== escenaId)
          : [...layout.grupos_plegados, escenaId],
      }),
    anadirPlano: async (escenaId) => {
      await api.crearPlano(escenaId);
      await onCambiado();
    },
    abrirGuionGrafico: (escenaId) =>
      setStoryboard(vista.escenas.findIndex((e) => e.escena.id === escenaId)),
    verEnGuion: () => {
      window.location.assign(rutaGuion);
    },
    abrirFicha: (nodoId) => {
      setSeleccion([nodoId]);
      guardar({ seleccion: [nodoId] });
      setFicha(nodoId);
    },
    moverPlano: async (planoId, direccion) => {
      await api.moverPlano(planoId, { direccion });
      await onCambiado();
    },
    duplicarPlano: async (planoId) => {
      await api.duplicarPlano(planoId);
      await onCambiado();
    },
    dividirPlano: async (planoId) => {
      await api.dividirPlano(planoId);
      await onCambiado();
    },
    borrarPlano: async (planoId) => {
      await api.borrarPlano(planoId);
      if (ficha === idPlano(planoId)) setFicha(null);
      await onCambiado();
    },
    urlMedio: api.urlMedio,
  };

  // Posición ≠ orden (§7.4): arrastrar solo guarda el layout.
  const alSoltarNodo = (_: unknown, nodo: Node) =>
    guardar({ posiciones: { ...layout.posiciones, [nodo.id]: nodo.position } });

  const alMover = (_: unknown, viewport: Viewport) => guardar({ viewport });

  const alPulsarNodo: NodeMouseHandler = (_, nodo) => {
    setSeleccion([nodo.id]);
    guardar({ seleccion: [nodo.id] });
  };

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (storyboard !== null) setStoryboard(null);
        else setFicha(null);
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [storyboard]);

  const nodoFicha = nodos.find((n) => n.id === ficha) || null;
  const entradaFicha = vista.reparto.find((r) => `el:${r.id}` === ficha) || null;
  const planoFicha = planos.find((p) => `pl:${p.id}` === ficha) || null;

  const posicionFicha = () => {
    if (!nodoFicha) return { x: 0, y: 0 };
    const ancho = nodoFicha.type === "elemento" ? ANCHO_ELEMENTO : ANCHO_PLANO;
    const p = flowToScreenPosition({
      x: nodoFicha.position.x + ancho + 16,
      y: nodoFicha.position.y,
    });
    return { x: p.x, y: p.y };
  };

  return (
    <ContextoLienzo.Provider value={acciones}>
      <div className="flex items-center gap-3 border-b border-linea bg-superficie px-6 py-2">
        <Boton
          pequeno
          variante="secundario"
          data-testid="btn-conexiones-reparto"
          aria-pressed={layout.mostrar_conexiones_reparto}
          onClick={() =>
            guardar({ mostrar_conexiones_reparto: !layout.mostrar_conexiones_reparto })
          }
        >
          {layout.mostrar_conexiones_reparto ? (
            <Link2 size={15} strokeWidth={1.9} />
          ) : (
            <Link2Off size={15} strokeWidth={1.9} />
          )}
          Conexiones de reparto
        </Boton>
        <Boton pequeno variante="secundario" data-testid="btn-recolocar" onClick={() => setRecolocar(true)}>
          <LayoutGrid size={15} strokeWidth={1.9} /> Recolocar
        </Boton>
        <Link
          to={rutaGuion}
          data-testid="btn-editar-en-guion"
          className="inline-flex items-center gap-1 rounded-control px-3 py-1.5 text-[14px] leading-[20px] text-acento hover:bg-acentoSuave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento"
        >
          <FileText size={15} strokeWidth={1.9} /> Editar en el guion
        </Link>
        <span className="ml-auto text-[13px] leading-[18px] text-tinta2" data-testid="lienzo-resumen">
          {vista.escenas.length} {vista.escenas.length === 1 ? "escena" : "escenas"} ·{" "}
          {planos.length} {planos.length === 1 ? "plano" : "planos"} · revisión {vista.guion.revision}
        </span>
      </div>

      <div className="flex-1" data-testid="superficie-lienzo">
        <ReactFlow
          nodes={nodos}
          edges={conexiones}
          nodeTypes={tiposNodo}
          onNodesChange={onNodosChange}
          onNodeDragStop={alSoltarNodo}
          onNodeClick={alPulsarNodo}
          onMoveEnd={alMover}
          defaultViewport={layout.viewport}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="var(--color-linea)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {planoFicha && (
        <FichaContextual
          testid="ficha-contextual-plano"
          titulo={`Plano ${etiquetaDe(planoFicha.id)}`}
          subtitulo={planoFicha.modalidad === "video" ? "Vídeo" : "Imagen"}
          posicion={posicionFicha()}
          onCerrar={() => setFicha(null)}
        >
          <FichaPlano
            key={planoFicha.id}
            plano={planoFicha}
            etiqueta={etiquetaDe(planoFicha.id)}
            reparto={vista.reparto}
            opciones={opciones}
            urlMedio={api.urlMedio}
            onCambiado={onCambiado}
          />
        </FichaContextual>
      )}

      {entradaFicha && (
        <FichaContextual
          testid="ficha-contextual-elemento"
          titulo={entradaFicha.elemento.nombre}
          subtitulo={`${entradaFicha.elemento.clase} · v${entradaFicha.version_ficha}`}
          posicion={posicionFicha()}
          onCerrar={() => setFicha(null)}
        >
          <FichaElementoLectura
            entrada={entradaFicha}
            urlMedio={api.urlMedio}
            rutaPaso={rutaDePaso(entradaFicha.elemento.clase)}
          />
        </FichaContextual>
      )}

      {storyboard !== null && (
        <GuionGrafico
          escenas={vista.escenas}
          indice={storyboard}
          onIndice={setStoryboard}
          onCerrar={() => setStoryboard(null)}
          onAbrirPlano={(planoId) => {
            setStoryboard(null);
            acciones.abrirFicha(idPlano(planoId));
          }}
        />
      )}

      <DialogoConfirmar
        abierto={recolocar}
        testid="confirmar-recolocar"
        titulo="¿Volver a la disposición automática?"
        mensaje="Se pierden las posiciones que hayas dado a las tarjetas. El orden de escenas y planos no cambia."
        etiquetaConfirmar="Recolocar"
        onConfirmar={() => {
          setRecolocar(false);
          guardar({ posiciones: {} });
        }}
        onCerrar={() => setRecolocar(false)}
      />
    </ContextoLienzo.Provider>
  );
}
