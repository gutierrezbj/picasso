import { test } from "node:test";
import assert from "node:assert/strict";
import { trasError } from "../src/lib/peticiones.ts";

test("errores del servidor o sin respuesta: la petición sigue pendiente", () => {
  for (const s of [500, 502, 503, 504, 408, 429]) assert.equal(trasError(s, "Error"), "incierta", String(s));
  assert.equal(trasError(null, "Failed to fetch"), "incierta");
});

test("rechazos definitivos: se puede olvidar la petición", () => {
  for (const s of [400, 404, 422]) assert.equal(trasError(s, "no"), "rechazada", String(s));
  assert.equal(trasError(409, "Solo se editan versiones de imagen."), "rechazada");
});

test("presupuesto superado: pide confirmar con el mismo identificador", () => {
  assert.equal(trasError(409, "Esta operación supera el presupuesto restante (0.01 USD)."), "presupuesto");
});
