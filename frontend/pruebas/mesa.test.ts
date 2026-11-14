import { test } from "node:test";
import assert from "node:assert/strict";
import { ALTO_TARJETA, ANCHO_TARJETA, colocar, linaje, recortar, type NodoArbol } from "../src/lib/mesa.ts";

const n = (id: string, origen: string | null, creado: string): NodoArbol => ({ id, origen, creado });

function sinSolapes(pos: Record<string, { x: number; y: number }>) {
  const lista = Object.entries(pos);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const [a, pa] = lista[i];
      const [b, pb] = lista[j];
      const separados = Math.abs(pa.x - pb.x) >= ANCHO_TARJETA || Math.abs(pa.y - pb.y) >= ALTO_TARJETA;
      assert.ok(separados, `${a} y ${b} se solapan`);
    }
  }
}

function barajar<T>(lista: T[], semilla: number): T[] {
  const copia = [...lista];
  let s = semilla;
  for (let i = copia.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function comprobarArbol(nodos: NodoArbol[]) {
  const pos = colocar(nodos);
  assert.equal(Object.keys(pos).length, nodos.length);
  sinSolapes(pos);
  for (const v of nodos) {
    if (v.origen && pos[v.origen]) assert.ok(pos[v.id].x > pos[v.origen].x, `${v.id} queda a la derecha de ${v.origen}`);
  }
  return pos;
}

test("una versión", () => {
  const pos = comprobarArbol([n("V1", null, "1")]);
  assert.deepEqual(pos.V1, { x: 0, y: 0 });
});

test("tres versiones: hijo y rama hermana apilados", () => {
  const pos = comprobarArbol([n("V1", null, "1"), n("V2", "V1", "2"), n("V3", "V1", "3")]);
  assert.equal(pos.V2.x, pos.V3.x);
  assert.ok(pos.V3.y > pos.V2.y);
  assert.equal(pos.V1.y, pos.V2.y);
});

const doce = [
  n("A1", null, "01"), n("A2", "A1", "02"), n("A3", "A1", "03"), n("A4", "A2", "04"),
  n("B1", null, "05"), n("B2", "B1", "06"), n("A5", "A4", "07"), n("B3", "B2", "08"),
  n("C1", null, "09"), n("A6", "A3", "10"), n("B4", "B1", "11"), n("C2", "C1", "12"),
];

test("doce versiones con tres raíces: sin solapes y raíces sin mezclar", () => {
  const pos = comprobarArbol(doce);
  const filas = (prefijo: string) => doce.filter((v) => v.id.startsWith(prefijo)).map((v) => pos[v.id].y);
  const rango = (p: string) => [Math.min(...filas(p)), Math.max(...filas(p))];
  const [a, b, c] = [rango("A"), rango("B"), rango("C")];
  assert.ok(a[1] < b[0] && b[1] < c[0], "cada raíz ocupa su propia franja");
  assert.ok(pos.A1.x === 0 && pos.B1.x === 0 && pos.C1.x === 0);
});

test("reordenar la respuesta del servidor no cambia el árbol", () => {
  const base = colocar(doce);
  for (let s = 1; s <= 25; s++) assert.deepEqual(colocar(barajar(doce, s)), base);
});

test("misma fecha: decide el id", () => {
  const a = colocar([n("x2", null, "5"), n("x1", null, "5")]);
  assert.ok(a.x1.y < a.x2.y);
});

test("un origen que no está en la carpeta se trata como raíz", () => {
  const pos = comprobarArbol([n("V2", "fuera", "2"), n("V1", null, "1")]);
  assert.equal(pos.V2.x, 0);
});

test("linaje y recorte", () => {
  const tomas = [
    { id: "a", origen_toma_id: null },
    { id: "b", origen_toma_id: "a" },
    { id: "c", origen_toma_id: "b" },
  ];
  assert.deepEqual(linaje("c", tomas).map((t) => t.id), ["a", "b", "c"]);
  assert.equal(recortar("ponle un sombrero de fieltro gris", 12), "ponle un so…");
  assert.equal(recortar("corto", 12), "corto");
});
