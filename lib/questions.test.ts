import { test } from "node:test";
import assert from "node:assert/strict";
import { pontuar, nivelDoTotal } from "./questions.ts";

test("níveis nas fronteiras", () => {
  assert.equal(nivelDoTotal(0), 1);
  assert.equal(nivelDoTotal(8), 1);
  assert.equal(nivelDoTotal(9), 2);
  assert.equal(nivelDoTotal(17), 2);
  assert.equal(nivelDoTotal(18), 3);
  assert.equal(nivelDoTotal(25), 3);
  assert.equal(nivelDoTotal(26), 4);
  assert.equal(nivelDoTotal(33), 4);
});

test("respostas máximas somam 33", () => {
  const p = pontuar({
    q1: "Todos os dias",
    q2: ["ChatGPT", "Claude", "Gemini", "Copilot"],
    q3: ["Escrever textos e copies", "Responder clientes", "Analisar números e relatórios", "Planilhas e fórmulas", "Aprender algo novo"],
    q4: 5,
    q5: "Tem modelos de pedido salvos e reaproveita",
    q6: "Confiro em outra fonte antes de usar",
    q7: "Sei e já vi acontecer",
    q8: "Só numa ferramenta aprovada pela empresa",
    q9: "Sei e ajusto isso nas configurações",
    q10: "Mais de 3 horas",
    q11: "Sim, e uso no dia a dia",
  });
  assert.equal(p.total, 33);
  assert.deepEqual(p.dimensoes, { uso: 9, dominio: 12, responsabilidade: 6, visao: 6 });
  assert.equal(p.nivel, 4);
});

test("tudo zerado dá nível 1; 'Nenhuma' zera ferramentas", () => {
  const p = pontuar({ q2: ["Nenhuma"], q3: ["Não uso"], q4: 1 });
  assert.equal(p.total, 0);
  assert.equal(p.nivel, 1);
});

test("faixas de ferramentas", () => {
  assert.equal(pontuar({ q2: ["Claude"] }).dimensoes.uso, 1);
  assert.equal(pontuar({ q2: ["Claude", "Gemini", "Copilot"] }).dimensoes.uso, 2);
  assert.equal(pontuar({ q2: ["Claude", "Gemini", "Copilot", "Meta AI"] }).dimensoes.uso, 3);
});
