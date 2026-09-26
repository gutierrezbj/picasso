import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Play, Check, Trash2 } from "lucide-react";
import Boton from "../Boton";
import Selector from "../Selector";
import { Campo, AreaTexto } from "../Campo";
import DialogoConfirmar from "../DialogoConfirmar";
import { api } from "../../api/cliente";
import { formatoMoneda } from "../../lib/formato";
import { ETIQUETA_ESTADO, colorEstado, textoCoste } from "./comun";
import type { FichaVersion, ModeloCatalogo, VistaOperacion } from "../../tipos";

interface Props {
  ficha: FichaVersion;
  clase: string;
  proyectoId: string;
  etiquetaBoton: string;
  editable: boolean;
  onCambiada: () => void | Promise<unknown>;
}

/** Preparar referencias (§6.2): hoja de personaje, photobook del producto o
 * lámina del escenario como operación de verdad del motor. Las tomas se revisan
 * y el usuario elige cuáles pasan a la ficha. */
export default function PanelReferencias({
  ficha,
  clase,
  proyectoId,
  etiquetaBoton,
  editable,
  onCambiada,
}: Props) {
  const [preparada, setPreparada] = useState<VistaOperacion | null>(null);
  const [borrador, setBorrador] = useState("");
  const [cuantas, setCuantas] = useState("4");
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ coste: number | null } | null>(null);

  const { data: catalogo } = useQuery({
    queryKey: ["catalogo", "generar_imagen"],
    queryFn: () => api.catalogo("generar_imagen"),
  });
  const { data: tomas, refetch } = useQuery({
    queryKey: ["tomas-ficha", ficha.id],
    queryFn: () => api.tomasDeFicha(ficha.id),
    refetchInterval: 4000,
  });
  const { data: operaciones, refetch: refetchOps } = useQuery({
    queryKey: ["operaciones-ficha", ficha.id],
    queryFn: () => api.operaciones({ destino_id: ficha.id }),
    refetchInterval: 4000,
  });
  const { data: presupuesto } = useQuery({
    queryKey: ["gasto", proyectoId],
    queryFn: () => api.gastoProyecto(proyectoId),
    refetchInterval: 6000,
  });

  const modelos = (catalogo || []).filter((m) => m.elegible);
  const [modeloId, setModeloId] = useState("");
  const modelo: ModeloCatalogo | null =
    modelos.find((m) => m.id === modeloId) || modelos[0] || null;
  const moneda = presupuesto?.moneda || "USD";
  const restante = presupuesto?.presupuesto_restante ?? null;

  const preparar = async () => {
    if (!modelo) return;
    setTrabajando(true);
    setError(null);
    try {
      const prep = await api.prepararReferencias(ficha.id, {
        destino_tipo: "ficha",
        destino_id: ficha.id,
        proyecto_id: proyectoId,
        accion: "generar_imagen",
        modelo: modelo.id,
        n_variantes: Number(cuantas) || 4,
      });
      setPreparada(prep);
      setBorrador(prep.operacion.prompt_visible);
      await refetchOps();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido preparar la lámina.");
    } finally {
      setTrabajando(false);
    }
  };

  const producir = async (confirmado: boolean) => {
    if (!preparada) return;
    setTrabajando(true);
    setError(null);
    try {
      await api.autorizarOperacion(preparada.operacion.id, confirmado);
      setPreparada(null);
      await Promise.all([refetch(), refetchOps()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido producir.");
    } finally {
      setTrabajando(false);
      setAviso(null);
    }
  };

  const coste = preparada?.operacion.coste_estimado ?? null;
  const supera = restante !== null && coste !== null && coste > restante;

  return (
    <div className="rounded-card border border-linea bg-superficie2 p-4" data-testid="panel-referencias">
      <div className="text-[14px] leading-[20px] font-medium text-tinta">Preparar referencias</div>
      <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
        Se prepara como operación del motor, con el coste delante. Las tomas se revisan y tú
        eliges cuáles pasan a la ficha.
      </p>

      {!preparada && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Campo etiqueta="Modelo">
            <Selector
              data-testid="referencias-modelo"
              valor={modelo?.id || ""}
              opciones={modelos.map((m) => ({ valor: m.id, texto: m.nombre_visible }))}
              onChange={setModeloId}
            />
          </Campo>
          <Campo etiqueta="Cuántas vistas">
            <Selector
              data-testid="referencias-cuantas"
              valor={cuantas}
              opciones={[2, 3, 4].map((n) => ({ valor: String(n), texto: `${n}` }))}
              onChange={setCuantas}
            />
          </Campo>
          <Boton
            pequeno
            variante="secundario"
            data-testid="btn-preparar-referencias"
            disabled={!modelo || trabajando || !editable}
            onClick={preparar}
          >
            <Wrench size={16} strokeWidth={1.9} /> {etiquetaBoton}
          </Boton>
          {!editable && (
            <span className="text-[13px] leading-[18px] text-tinta2">
              Esta versión está aprobada: crea una versión nueva para añadir referencias.
            </span>
          )}
        </div>
      )}

      {preparada && (
        <div
          data-testid="referencias-preparada"
          className="mt-3 rounded-control border border-acento bg-acentoSuave p-3"
        >
          <Campo etiqueta="Lo que se le pide al modelo" ayuda="Puedes editarlo antes de producir.">
            <AreaTexto
              data-testid="referencias-prompt"
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onBlur={async () => {
                if (borrador === preparada.operacion.prompt_visible) return;
                const nueva = await api.editarOperacion(preparada.operacion.id, {
                  prompt_manual: borrador,
                });
                setPreparada(nueva);
              }}
              className="min-h-[110px]"
            />
          </Campo>
          <p className="mt-1 text-[13px] leading-[18px] text-tinta2">
            {preparada.operacion.entradas.n_variantes} vistas · coste{" "}
            {textoCoste(coste, moneda)}
            {preparada.modelo && !preparada.modelo.coste.verificado ? " · precio simulado" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Boton
              data-testid="btn-producir-referencias"
              disabled={trabajando}
              onClick={() => (supera ? setAviso({ coste }) : producir(false))}
            >
              <Play size={15} strokeWidth={1.9} />
              {coste === null
                ? "Producir (coste sin verificar)"
                : `Producir por ${formatoMoneda(coste, moneda)}`}
            </Boton>
            <Boton
              pequeno
              variante="texto"
              data-testid="btn-descartar-referencias"
              onClick={async () => {
                await api.descartarOperacion(preparada.operacion.id);
                setPreparada(null);
                await refetchOps();
              }}
            >
              <Trash2 size={14} strokeWidth={1.9} /> Descartar
            </Boton>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] leading-[18px] text-aviso">{error}</p>}

      {(operaciones || []).some((o) => o.estado !== "completada" && o.estado !== "descartada") && (
        <ul className="mt-3 flex flex-col gap-1" data-testid="referencias-operaciones">
          {(operaciones || [])
            .filter((o) => o.estado !== "completada" && o.estado !== "descartada")
            .map((o) => (
              <li key={o.id} className="text-[13px] leading-[18px]">
                <span className={colorEstado(o.estado)}>{ETIQUETA_ESTADO[o.estado]}</span>
                {o.posicion_cola ? ` · en cola, posición ${o.posicion_cola}` : ""}
                {o.error ? ` · ${o.error}` : ""}
              </li>
            ))}
        </ul>
      )}

      {(tomas?.tomas || []).length > 0 && (
        <div className="mt-4">
          <div className="text-[14px] leading-[20px] font-medium text-tinta">
            Tomas de la lámina ({tomas?.tomas.length})
          </div>
          <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="tomas-ficha">
            {(tomas?.tomas || []).map((t) => {
              const yaEsta = (ficha.referencias || []).some((r) => r.medio_id === t.medio_id);
              return (
                <li
                  key={t.id}
                  data-testid={`toma-ficha-${t.numero}`}
                  className="rounded-card border border-linea bg-superficie p-2"
                >
                  {t.medio && (
                    <img
                      src={api.urlMedio(t.medio.id)}
                      alt={`Toma ${t.numero}`}
                      className="w-full rounded-control bg-superficie2 object-contain"
                      style={{ aspectRatio: "1 / 1" }}
                    />
                  )}
                  <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
                    {t.exploracion?.encuadre || `Vista ${t.numero}`}
                  </p>
                  <Boton
                    pequeno
                    className="mt-1 w-full"
                    variante={yaEsta ? "texto" : "secundario"}
                    disabled={yaEsta || !editable}
                    data-testid={`pasar-a-ficha-${t.numero}`}
                    onClick={async () => {
                      await api.pasarTomaAFicha(t.id, "otra");
                      await Promise.all([refetch(), onCambiada()]);
                    }}
                  >
                    <Check size={13} strokeWidth={1.9} />
                    {yaEsta ? "Ya es referencia" : "Pasar a la ficha"}
                  </Boton>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DialogoConfirmar
        abierto={aviso !== null}
        testid="confirmar-presupuesto-referencias"
        titulo="Esto pasa del presupuesto"
        mensaje={
          aviso
            ? `Esta lámina cuesta ${textoCoste(aviso.coste, moneda)} y del presupuesto queda ` +
              `${restante === null ? "—" : formatoMoneda(restante, moneda)}. ¿Sigues adelante?`
            : ""
        }
        etiquetaConfirmar="Sí, producir"
        onConfirmar={() => producir(true)}
        onCerrar={() => setAviso(null)}
      />
    </div>
  );
}
