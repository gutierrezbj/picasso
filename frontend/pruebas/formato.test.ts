import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoMoneda } from "../src/lib/formato.ts";

test("importes pequeños: no se convierten en «0,00 $»", () => {
  assert.equal(formatoMoneda(0.0032, "USD"), "0,0032 $");
  assert.equal(formatoMoneda(0.1968, "USD"), "0,1968 $");
  assert.equal(formatoMoneda(0.197, "USD"), "0,197 $");
});

test("importes en céntimos: siguen con dos decimales", () => {
  assert.equal(formatoMoneda(0.2, "USD"), "0,20 $");
  assert.equal(formatoMoneda(0, "USD"), "0,00 $");
  assert.equal(formatoMoneda(12.5, "EUR"), "12,50 €");
  assert.equal(formatoMoneda(null, "USD"), "0,00 $");
});
