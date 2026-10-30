import { test } from "node:test";
import assert from "node:assert/strict";
import { celulaCsv, mediasPorDimensao, type LinhaP } from "./painel.ts";

test("CSV neutraliza fórmula e escapa aspas/ponto e vírgula", () => {
  assert.equal(celulaCsv("=1+1"), "'=1+1");
  assert.equal(celulaCsv("-2"), "'-2");
  assert.equal(celulaCsv('a;b'), '"a;b"');
  assert.equal(celulaCsv('diz "oi"'), '"diz ""oi"""');
  assert.equal(celulaCsv(["A", "B"]), "A | B");
  assert.equal(celulaCsv(null), "");
});

test("média por dimensão em %", () => {
  const l = { uso: 9, dominio: 6, responsabilidade: 0, visao: 3 } as LinhaP;
  const m = mediasPorDimensao([l]);
  assert.deepEqual(m, { uso: 100, dominio: 50, responsabilidade: 0, visao: 50 });
  assert.equal(mediasPorDimensao([]).uso, 0);
});
