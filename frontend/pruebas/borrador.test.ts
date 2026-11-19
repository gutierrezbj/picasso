import { test } from "node:test";
import assert from "node:assert/strict";
import { accionReintento, restaurarAlcance } from "../src/lib/borrador.ts";

const tomas = [
  { id: "t1", numero: 1 },
  { id: "t2", numero: 2 },
];

test("recarga con «Editar V1»: espera a las versiones antes de activar nada", () => {
  const alcance = { tipo: "editar", toma_id: "t1" };
  assert.deepEqual(restaurarAlcance(alcance, null), { listo: false, seleccion: null, aviso: null });
  assert.deepEqual(restaurarAlcance(alcance, tomas), { listo: true, seleccion: "t1", aviso: null });
});

test("recarga con «Nueva imagen» o sin alcance: listo sin esperar", () => {
  assert.deepEqual(restaurarAlcance({ tipo: "nueva" }, null), { listo: true, seleccion: null, aviso: null });
  assert.deepEqual(restaurarAlcance(undefined, null), { listo: true, seleccion: null, aviso: null });
});

test("la versión editada ya no existe: vuelve a «Nueva imagen» avisando", () => {
  const r = restaurarAlcance({ tipo: "editar", toma_id: "t9" }, tomas);
  assert.equal(r.listo, true);
  assert.equal(r.seleccion, null);
  assert.match(r.aviso || "", /Nueva imagen/);
});

test("reintento: pedir precio, confirmar y continuar tras recargar", () => {
  assert.equal(accionReintento({ estado: "fallida" }, null), "pedir");
  assert.equal(accionReintento({ estado: "fallida" }, { id: "p1" }), "confirmar");
  assert.equal(accionReintento({ estado: "presupuestada", presupuesto_id: "p1" }, null), "continuar");
});

test("reintento: nada con bloqueo, en marcha o terminada", () => {
  assert.equal(accionReintento({ estado: "fallida", bloqueo: { activo: true } }, { id: "p1" }), null);
  assert.equal(accionReintento({ estado: "presupuestada", presupuesto_id: "p1", bloqueo: { activo: true } }, null), null);
  for (const estado of ["autorizada", "enviada", "en_curso", "completada", "incierta"]) assert.equal(accionReintento({ estado }, { id: "p1" }), null, estado);
});

test("pendiente con presupuesto nuevo por cambio de tarifa: se confirma el nuevo, no el antiguo", () => {
  const m = { estado: "presupuestada", presupuesto_id: "antiguo" };
  assert.equal(accionReintento(m, { id: "nuevo", reserva_estimada: 0.0281 }), "confirmar");
  assert.equal(accionReintento(m, null), "continuar");
});
