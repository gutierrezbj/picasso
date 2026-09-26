import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Play, RefreshCw, Search, Grid2X2, Trash2 } from "lucide-react";
import Boton from "../Boton";
import Selector from "../Selector";
import { Campo, Entrada, AreaTexto } from "../Campo";
import DialogoConfirmar from "../DialogoConfirmar";
import { api } from "../../api/cliente";
import { formatoMoneda } from "../../lib/formato";
import {
  ETIQUETA_ACCION,
  ETIQUETA_ESTADO,
  colorEstado,
  costeEstimado,
  textoCoste,
} from "../motor/comun";
import type {
  Accion,
  ModeloCatalogo,
  Operacion,
  Plano,
  SimulacionPrueba,
  VistaOperacion,
} from "../../tipos";

interface Props {
  plano: Plano;
  /** Corrección que hay que preparar al abrir (§7.7d). */
  correccionId?: string | null;
  onCorreccionAtendida?: () => void;
  onCambiado: () => void | Promise<unknown>;
}

const ACCIONES_IMAGEN: Accion[] = ["generar_imagen", "imagen_con_referencias"];
const ACCIONES_VIDEO: Accion[] = ["generar_video"];

const SIMULACIONES: { valor: SimulacionPrueba; texto: string }[] = [
  { valor: "normal", texto: "Normal" },
  { valor: "fallo", texto: "Que falle" },
  { valor: "incierto", texto: "Que quede incierta (sin respuesta al enviar)" },
  { valor: "timeout", texto: "Que se pierda el seguimiento" },
];

const masCercana = (valor: number, admitidas: number[]): number =>
  admitidas.reduce((a, b) => (Math.abs(b - valor) < Math.abs(a - valor) ? b : a), admitidas[0]);

const listaDuraciones = (admitidas: number[]): string =>
  admitidas.map((d) => `${d}`.replace(".", ",")).join(", ");

export default function PanelProducir({
  plano,
  correccionId = null,
  onCorreccionAtendida,
  onCambiado,
}: Props) {
  const modalidad = plano.modalidad;
  const [accion, setAccion] = useState<Accion>(
    modalidad === "video" ? "generar_video" : "generar_imagen"
  );
  const [modeloId, setModeloId] = useState<string>("");
  const [duracion, setDuracion] = useState<string>(
    plano.duracion_s === null ? "" : String(plano.duracion_s)
  );
  const [texto, setTexto] = useState("");
  const [variantes, setVariantes] = useState("4");
  const [simular, setSimular] = useState<SimulacionPrueba>("normal");
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{
    coste: number | null;
    ejecutar: (confirmado: boolean) => Promise<void>;
  } | null>(null);

  // Operación preparada (correcciones): se ve el coste y el prompt antes de producir.
  const [preparada, setPreparada] = useState<VistaOperacion | null>(null);
  const [borrador, setBorrador] = useState("");
  const [duracionPreparada, setDuracionPreparada] = useState<string>("");

  const { data: catalogo } = useQuery({ queryKey: ["catalogo"], queryFn: () => api.catalogo() });
  const { data: produccion, refetch } = useQuery({
    queryKey: ["produccion", plano.id],
    queryFn: () => api.produccion(plano.id),
    refetchInterval: 4000,
  });

  const acciones: Accion[] = [
    ...(modalidad === "video" ? ACCIONES_VIDEO : ACCIONES_IMAGEN),
    "generar_voz",
  ];
  const modelos = (catalogo || []).filter((m) => m.acciones.includes(accion));
  const modelo: ModeloCatalogo | null =
    modelos.find((m) => m.id === modeloId) || modelos.find((m) => m.elegible) || null;
  const moneda = produccion?.presupuesto.moneda || "USD";
  const gasto = produccion?.presupuesto.gasto;
  const restante = produccion?.presupuesto.presupuesto_restante ?? null;

  // Duración: parte de la del plano; si el modelo no la admite, se dice y se
  // produce (y se cobra) una admitida.
  const admitidas = modelo?.duraciones_s || [];
  const pedida = duracion === "" ? null : Number(duracion);
  const duracionEfectiva =
    admitidas.length === 0
      ? pedida
      : pedida === null
        ? admitidas[0]
        : masCercana(pedida, admitidas);
  const duracionCambiada =
    accion === "generar_video" &&
    admitidas.length > 0 &&
    pedida !== null &&
    Math.abs((duracionEfectiva || 0) - pedida) > 0.001;

  const coste = costeEstimado(modelo, {
    duracion_s: accion === "generar_video" ? duracionEfectiva : null,
    texto,
    variantes: 1,
  });
  const costeExploracion = costeEstimado(modelo, { variantes: Number(variantes) || 4 });
  const supera = (c: number | null) => restante !== null && c !== null && c > restante;

  const conAviso = (c: number | null, ejecutar: (confirmado: boolean) => Promise<void>) => {
    if (supera(c)) setAviso({ coste: c, ejecutar });
    else void ejecutar(false);
  };

  const tras = async () => {
    await refetch();
    await onCambiado();
  };

  const cuerpo = (exploracion: boolean) => ({
    destino_id: plano.id,
    accion,
    modelo: modelo?.id,
    duracion_s: accion === "generar_video" ? duracionEfectiva : null,
    texto: accion === "generar_voz" ? texto : null,
    n_variantes: exploracion ? Number(variantes) || 4 : 1,
    simular_resultado: simular,
  });

  const producir = async (exploracion: boolean, confirmado: boolean) => {
    if (!modelo) return;
    setTrabajando(true);
    setError(null);
    try {
      const prep = exploracion
        ? await api.explorarEncuadres(plano.id, cuerpo(true))
        : await api.prepararOperacion(cuerpo(false));
      await api.autorizarOperacion(prep.operacion.id, confirmado);
      await tras();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido producir.");
    } finally {
      setTrabajando(false);
      setAviso(null);
    }
  };

  // --- corrección: se prepara al abrir y se produce con su propio botón ---
  useEffect(() => {
    if (!correccionId || !catalogo) return;
    let cancelado = false;
    const preparar = async () => {
      const accionCorreccion: Accion =
        modalidad === "video" ? "generar_video" : "editar_imagen";
      const candidatos = catalogo.filter(
        (m) => m.elegible && m.acciones.includes(accionCorreccion)
      );
      const elegido = candidatos[0];
      if (!elegido) {
        setError(
          `No hay ningún modelo disponible para «${ETIQUETA_ACCION[accionCorreccion]}» en el catálogo.`
        );
        onCorreccionAtendida?.();
        return;
      }
      const dur =
        accionCorreccion === "generar_video"
          ? elegido.duraciones_s.length > 0
            ? masCercana(plano.duracion_s || elegido.duraciones_s[0], elegido.duraciones_s)
            : plano.duracion_s
          : null;
      try {
        const prep = await api.prepararCorreccion(correccionId, {
          destino_id: plano.id,
          accion: accionCorreccion,
          modelo: elegido.id,
          duracion_s: dur,
        });
        if (cancelado) return;
        setPreparada(prep);
        setBorrador(prep.operacion.prompt_visible);
        setDuracionPreparada(dur === null ? "" : String(dur));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se ha podido preparar la corrección.");
      } finally {
        onCorreccionAtendida?.();
      }
    };
    void preparar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line
  }, [correccionId, catalogo]);

  const modelosPreparada = preparada
    ? (catalogo || []).filter((m) => m.acciones.includes(preparada.operacion.accion))
    : [];
  const modeloPreparada = preparada
    ? modelosPreparada.find((m) => m.id === preparada.operacion.modelo) || null
    : null;
  const admitidasPreparada = modeloPreparada?.duraciones_s || [];

  const actualizarPreparada = async (cambios: Record<string, unknown>) => {
    if (!preparada) return;
    setError(null);
    try {
      const nueva = await api.editarOperacion(preparada.operacion.id, cambios);
      setPreparada(nueva);
      setBorrador(nueva.operacion.prompt_visible);
      setDuracionPreparada(
        nueva.operacion.entradas.duracion_s === null
          ? ""
          : String(nueva.operacion.entradas.duracion_s)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido recalcular el coste.");
    }
  };

  const producirPreparada = async (confirmado: boolean) => {
    if (!preparada) return;
    setTrabajando(true);
    setError(null);
    try {
      await api.autorizarOperacion(preparada.operacion.id, confirmado);
      setPreparada(null);
      await tras();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido producir.");
    } finally {
      setTrabajando(false);
      setAviso(null);
    }
  };

  const accionOperacion = async (op: Operacion, que: "comprobar" | "reintentar" | "fallida") => {
    setError(null);
    try {
      if (que === "comprobar") await api.comprobarOperacion(op.id);
      if (que === "reintentar") await api.reintentarOperacion(op.id);
      if (que === "fallida") await api.marcarFallida(op.id);
      await tras();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido.");
    }
  };

  const esSimulado = modelo?.proveedor === "simulado";

  return (
    <div className="mt-4 flex flex-col gap-4" data-testid="panel-producir">
      {preparada && (
        <div
          data-testid="operacion-preparada"
          className="rounded-card border border-acento bg-acentoSuave p-3"
        >
          <p className="text-[14px] leading-[20px] font-semibold text-tinta">
            {preparada.operacion.correccion_id
              ? "Corrección preparada"
              : "Operación preparada"}
          </p>
          <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
            Todavía no se ha enviado nada. Repasa lo que se le pide al modelo y produce cuando
            quieras.
          </p>

          <Campo etiqueta="Modelo" ayuda="Cambiarlo solo recalcula el coste.">
            <Selector
              data-testid="preparada-modelo"
              valor={preparada.operacion.modelo}
              opciones={modelosPreparada.map((m) => ({
                valor: m.id,
                texto: `${m.nombre_visible}${m.elegible ? "" : " — no disponible"}`,
              }))}
              onChange={(v) => actualizarPreparada({ modelo: v })}
            />
          </Campo>

          <Campo
            etiqueta={
              preparada.operacion.accion === "editar_imagen"
                ? "Qué hay que cambiar"
                : "Lo que se le pide al modelo"
            }
            ayuda="Puedes editarlo antes de producir."
          >
            <AreaTexto
              data-testid="preparada-prompt"
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onBlur={() => {
                if (borrador === preparada.operacion.prompt_visible) return;
                void actualizarPreparada(
                  preparada.operacion.accion === "editar_imagen"
                    ? { instruccion: borrador }
                    : { prompt_manual: borrador }
                );
              }}
              className="min-h-[96px]"
            />
          </Campo>

          {preparada.operacion.accion === "generar_video" && admitidasPreparada.length > 0 && (
            <Campo etiqueta="Duración (s)">
              <Selector
                data-testid="preparada-duracion"
                valor={duracionPreparada || String(admitidasPreparada[0])}
                opciones={admitidasPreparada.map((d) => ({
                  valor: String(d),
                  texto: `${d} s`,
                }))}
                onChange={(v) => {
                  setDuracionPreparada(v);
                  void actualizarPreparada({ duracion_s: Number(v) });
                }}
              />
            </Campo>
          )}

          <p className="mt-2 text-[13px] leading-[18px] text-tinta2">
            Coste: {textoCoste(preparada.operacion.coste_estimado, moneda)}
            {modeloPreparada?.precio_simulado ? " · precio simulado" : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Boton
              data-testid="btn-producir-preparada"
              disabled={trabajando}
              onClick={() =>
                conAviso(preparada.operacion.coste_estimado, producirPreparada)
              }
            >
              <Play size={15} strokeWidth={1.9} />
              {preparada.operacion.coste_estimado === null
                ? "Producir (coste sin verificar)"
                : `Producir por ${formatoMoneda(preparada.operacion.coste_estimado, moneda)}`}
            </Boton>
            <Boton
              pequeno
              variante="texto"
              data-testid="btn-descartar-preparada"
              onClick={async () => {
                await api.descartarOperacion(preparada.operacion.id);
                setPreparada(null);
                await tras();
              }}
            >
              <Trash2 size={14} strokeWidth={1.9} /> Descartar
            </Boton>
          </div>
        </div>
      )}

      <Campo etiqueta="Qué se produce">
        <Selector
          data-testid="producir-accion"
          valor={accion}
          opciones={acciones.map((a) => ({ valor: a, texto: ETIQUETA_ACCION[a] }))}
          onChange={(v) => {
            setAccion(v as Accion);
            setModeloId("");
          }}
        />
      </Campo>

      <Campo etiqueta="Modelo" ayuda="Cambiar de modelo solo recalcula el coste: no envía nada.">
        <Selector
          data-testid="producir-modelo"
          valor={modelo?.id || ""}
          opciones={modelos.map((m) => ({
            valor: m.id,
            texto: `${m.nombre_visible}${m.elegible ? "" : " — no disponible"}`,
          }))}
          onChange={setModeloId}
        />
        {modelo && !modelo.elegible && (
          <p data-testid="modelo-no-elegible" className="mt-1 text-[12px] leading-[16px] text-aviso">
            {modelo.motivo_no_elegible}
          </p>
        )}
        {modelo?.precio_simulado && (
          <p className="mt-1 text-[12px] leading-[16px] text-tinta2">precio simulado</p>
        )}
      </Campo>

      {accion === "generar_video" && (
        <Campo
          etiqueta="Duración (s)"
          ayuda={
            plano.duracion_s
              ? `El plano dura ${plano.duracion_s} s.`
              : "Este plano no tiene duración puesta."
          }
        >
          {admitidas.length > 0 ? (
            <Selector
              data-testid="producir-duracion"
              valor={String(duracionEfectiva)}
              opciones={admitidas.map((d) => ({ valor: String(d), texto: `${d} s` }))}
              onChange={setDuracion}
            />
          ) : (
            <Entrada
              data-testid="producir-duracion"
              type="number"
              min="0"
              step="0.5"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          )}
          {duracionCambiada && modelo && (
            <p data-testid="aviso-duracion" className="mt-1 text-[12px] leading-[16px] text-aviso">
              «{modelo.nombre_visible}» solo admite {listaDuraciones(admitidas)} s. Se producirá
              y se cobrará {duracionEfectiva} s.
            </p>
          )}
        </Campo>
      )}

      {accion === "generar_voz" && (
        <Campo etiqueta="Texto que se dice" ayuda="La voz simulada se cobra por carácter.">
          <AreaTexto
            data-testid="producir-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[60px]"
          />
        </Campo>
      )}

      {esSimulado && (
        <Campo
          etiqueta="Prueba · simular resultado"
          ayuda="Solo existe con el proveedor simulado."
        >
          <Selector
            data-testid="producir-simular"
            valor={simular}
            opciones={SIMULACIONES.map((s) => ({ valor: s.valor, texto: s.texto }))}
            onChange={(v) => setSimular(v as SimulacionPrueba)}
          />
        </Campo>
      )}

      <div
        data-testid="presupuesto-plano"
        className="rounded-card border border-linea bg-superficie2 p-3 text-[13px] leading-[18px] text-tinta2"
      >
        <p className="text-[14px] leading-[20px] font-semibold text-tinta">
          Coste de esta operación: {textoCoste(coste, moneda)}
        </p>
        {gasto && (
          <p className="mt-1">
            Gasto del proyecto: {formatoMoneda(gasto.total, moneda)} (
            {formatoMoneda(gasto.real, moneda)} cobrado +{" "}
            {formatoMoneda(gasto.reservado, moneda)} reservado)
          </p>
        )}
        <p className="mt-1">
          Presupuesto restante:{" "}
          {restante === null ? "sin presupuesto fijado" : formatoMoneda(restante, moneda)}
        </p>
        {gasto && gasto.sin_verificar > 0 && (
          <p className="mt-1 text-aviso">
            {gasto.sin_verificar} operaciones con coste sin verificar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Boton
          data-testid="btn-producir"
          disabled={!modelo?.elegible || trabajando || (accion === "generar_voz" && !texto.trim())}
          onClick={() => conAviso(coste, (c) => producir(false, c))}
        >
          <Play size={15} strokeWidth={1.9} />
          {coste === null
            ? "Producir (coste sin verificar)"
            : `Producir por ${formatoMoneda(coste, moneda)}`}
        </Boton>
      </div>

      {modalidad !== "video" && (
        <div className="rounded-card border border-linea p-3">
          <p className="text-[14px] leading-[20px] font-semibold text-tinta">
            Explorar encuadres
          </p>
          <p className="mt-1 text-[12px] leading-[16px] text-tinta2">
            Genera varias imágenes del mismo plano cambiando solo encuadre y ángulo. Son tomas de
            exploración: elegir una fija esos valores.
          </p>
          <div className="mt-2 flex items-end gap-2">
            <Campo etiqueta="Cuántas">
              <Entrada
                data-testid="explorar-cuantas"
                type="number"
                min="2"
                max="8"
                value={variantes}
                onChange={(e) => setVariantes(e.target.value)}
                className="w-20"
              />
            </Campo>
            <Boton
              pequeno
              variante="secundario"
              data-testid="btn-explorar-encuadres"
              disabled={!modelo?.elegible || trabajando}
              onClick={() => conAviso(costeExploracion, (c) => producir(true, c))}
            >
              <Grid2X2 size={15} strokeWidth={1.9} />
              {costeExploracion === null
                ? "Explorar (coste sin verificar)"
                : `Explorar por ${formatoMoneda(costeExploracion, moneda)}`}
            </Boton>
          </div>
        </div>
      )}

      {error && (
        <p data-testid="error-producir" className="text-[13px] leading-[18px] text-aviso">
          {error}
        </p>
      )}

      <div className="border-t border-linea pt-3">
        <h3 className="text-[14px] leading-[20px] font-semibold text-tinta">
          Operaciones de este plano
        </h3>
        <ul className="mt-2 flex flex-col gap-2" data-testid="operaciones-plano">
          {(produccion?.operaciones || []).length === 0 && (
            <li className="text-[13px] leading-[18px] text-tinta3">Todavía no has producido nada.</li>
          )}
          {(produccion?.operaciones || []).map((op) => (
            <li
              key={op.id}
              data-testid={`operacion-${op.id}`}
              className="rounded-control border border-linea bg-superficie p-2.5 text-[13px] leading-[18px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-tinta">
                  {ETIQUETA_ACCION[op.accion]} · {op.modelo_visible || op.modelo}
                </span>
                <span className={colorEstado(op.estado)} data-testid={`estado-${op.id}`}>
                  {ETIQUETA_ESTADO[op.estado]}
                  {op.posicion_cola ? ` · en cola, posición ${op.posicion_cola}` : ""}
                </span>
              </div>
              {op.correccion_texto && (
                <p className="mt-1 text-tinta2">Corrección: {op.correccion_texto}</p>
              )}
              {op.es_exploracion && <p className="mt-1 text-tinta2">Exploración</p>}
              {op.entradas.instruccion && !op.correccion_texto && (
                <p className="mt-1 text-tinta2">Ajuste: {op.entradas.instruccion}</p>
              )}
              <p className="mt-1 text-tinta2">
                {op.coste_real !== null
                  ? `Cobrado ${formatoMoneda(op.coste_real, moneda)}`
                  : `Estimado ${textoCoste(op.coste_estimado, moneda)}`}
                {op.numero_intentos ? ` · ${op.numero_intentos} intento(s)` : ""}
              </p>
              {op.error && (
                <p className="mt-1 flex items-start gap-1 text-aviso">
                  <AlertTriangle size={13} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                  {op.error}
                </p>
              )}
              {(op.estado === "incierta" || op.estado === "fallida") && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {op.estado === "incierta" && (
                    <>
                      <Boton
                        pequeno
                        variante="secundario"
                        data-testid={`comprobar-${op.id}`}
                        onClick={() => accionOperacion(op, "comprobar")}
                      >
                        <Search size={13} strokeWidth={1.9} /> Comprobar
                      </Boton>
                      <Boton
                        pequeno
                        variante="texto"
                        data-testid={`marcar-fallida-${op.id}`}
                        onClick={() => accionOperacion(op, "fallida")}
                      >
                        Marcar como fallida
                      </Boton>
                    </>
                  )}
                  {op.estado === "fallida" && (
                    <Boton
                      pequeno
                      variante="secundario"
                      data-testid={`reintentar-${op.id}`}
                      onClick={() => accionOperacion(op, "reintentar")}
                    >
                      <RefreshCw size={13} strokeWidth={1.9} /> Reintentar
                    </Boton>
                  )}
                </div>
              )}
              {(op.estado === "presupuestada" || op.estado === "preparada") && (
                <Boton
                  pequeno
                  className="mt-2"
                  data-testid={`autorizar-${op.id}`}
                  onClick={() =>
                    conAviso(op.coste_estimado, async (confirmado) => {
                      await api.autorizarOperacion(op.id, confirmado);
                      await tras();
                      setAviso(null);
                    })
                  }
                >
                  Producir por {textoCoste(op.coste_estimado, moneda)}
                </Boton>
              )}
            </li>
          ))}
        </ul>
      </div>

      <DialogoConfirmar
        abierto={aviso !== null}
        testid="confirmar-presupuesto"
        titulo="Esto pasa del presupuesto"
        mensaje={
          aviso
            ? `Esta operación cuesta ${textoCoste(aviso.coste, moneda)} y del presupuesto ` +
              `queda ${restante === null ? "—" : formatoMoneda(restante, moneda)}. ` +
              "¿Sigues adelante?"
            : ""
        }
        etiquetaConfirmar="Sí, producir"
        onConfirmar={() => aviso && void aviso.ejecutar(true)}
        onCerrar={() => setAviso(null)}
      />
    </div>
  );
}
