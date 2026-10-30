import { test } from "node:test";
import assert from "node:assert/strict";
import { tratarEnvio, chaveDaPessoa, LIMITE_POR_HORA, type NovaLinha, type Repo } from "./envio.ts";
import { CAMPO_ARMADILHA } from "./schema.ts";

const INICIO = 1_000_000;
const AGORA = INICIO + 40_000;

const respostas = {
  q1: "Todos os dias",
  q2: ["ChatGPT", "Claude"],
  q3: ["Escrever textos e copies"],
  q4: 4,
  q5: "Reformula até ficar bom",
  q6: "Confiro em outra fonte antes de usar",
  q7: "Sei e já vi acontecer",
  q8: "Sim, mas tiro nomes e dados sensíveis antes",
  q9: "Acho que sim ou que não",
  q10: "De 1 a 3 horas",
  q11: "Já tentei",
  q12: 5,
  q13: ["Falta de tempo para aprender"],
  q14: "Montar relatório",
  q15: "Sim",
};

const base = { nome: "Ana Souza", area: "Social media", tempo: "1 a 2 anos", respostas, iniciouEm: INICIO };

function repoFalso(recentes = 0) {
  const gravadas: NovaLinha[] = [];
  const repo: Repo = {
    contarRecentes: async () => recentes,
    inserir: async (l) => void gravadas.push(l),
  };
  return { repo, gravadas };
}

test("envio normal grava, sem marca de suspeito", async () => {
  const { repo, gravadas } = repoFalso();
  const r = await tratarEnvio(base, { agora: AGORA, ipHash: "ip", repo });
  assert.deepEqual(r, { ok: true });
  assert.equal(gravadas.length, 1);
  assert.equal(gravadas[0].suspeito, false);
  assert.equal(gravadas[0].pessoaChave, "ana souza|Social media");
});

test("armadilha preenchida (autopreenchimento) grava como suspeito e NÃO descarta", async () => {
  const { repo, gravadas } = repoFalso();
  const r = await tratarEnvio({ ...base, [CAMPO_ARMADILHA]: "High Media Ltda" }, { agora: AGORA, ipHash: "ip", repo });
  assert.deepEqual(r, { ok: true });
  assert.equal(gravadas.length, 1);
  assert.equal(gravadas[0].suspeito, true);
});

test("armadilha com texto longo ou tipo estranho nunca vira erro", async () => {
  const { repo, gravadas } = repoFalso();
  const longo = await tratarEnvio({ ...base, [CAMPO_ARMADILHA]: "x".repeat(400) }, { agora: AGORA, ipHash: "ip", repo });
  const estranho = await tratarEnvio({ ...base, [CAMPO_ARMADILHA]: 42 }, { agora: AGORA, ipHash: "ip", repo });
  assert.equal(longo.ok, true);
  assert.equal(estranho.ok, true);
  assert.equal(gravadas.length, 2);
});

test("pergunta faltando dá mensagem em português, sem texto cru do zod", async () => {
  const { repo, gravadas } = repoFalso();
  const { q7, ...semQ7 } = respostas;
  void q7;
  const logs: unknown[] = [];
  const r = await tratarEnvio({ ...base, respostas: semQ7 }, { agora: AGORA, ipHash: "ip", repo, log: (m, d) => logs.push([m, d]) });
  assert.deepEqual(r, { ok: false, erro: "Faltou responder a pergunta 7." });
  assert.equal(gravadas.length, 0);
  assert.equal(logs.length, 1); // o detalhe técnico vai para o log
  assert.ok(!/expected|too (big|small)|invalid/i.test((r as { erro: string }).erro));
});

test("nome vazio e área inválida também saem em português", async () => {
  const { repo } = repoFalso();
  const a = await tratarEnvio({ ...base, nome: " " }, { agora: AGORA, ipHash: "ip", repo });
  const b = await tratarEnvio({ ...base, area: "Marte" }, { agora: AGORA, ipHash: "ip", repo });
  assert.deepEqual(a, { ok: false, erro: "Faltou preencher o seu nome." });
  assert.deepEqual(b, { ok: false, erro: "Faltou escolher a sua área." });
});

test("tempo mínimo e limite por IP (60/h) continuam valendo", async () => {
  const { repo, gravadas } = repoFalso();
  const rapido = await tratarEnvio({ ...base, iniciouEm: AGORA - 5_000 }, { agora: AGORA, ipHash: "ip", repo });
  assert.equal(rapido.ok, false);
  const cheio = repoFalso(LIMITE_POR_HORA);
  const lim = await tratarEnvio(base, { agora: AGORA, ipHash: "ip", repo: cheio.repo });
  assert.equal(lim.ok, false);
  const ainda = repoFalso(LIMITE_POR_HORA - 1);
  assert.equal((await tratarEnvio(base, { agora: AGORA, ipHash: "ip", repo: ainda.repo })).ok, true);
  assert.equal(gravadas.length + cheio.gravadas.length, 0);
  assert.equal(LIMITE_POR_HORA, 60);
});

test("falha do banco devolve mensagem amigável", async () => {
  const repo: Repo = { contarRecentes: async () => 0, inserir: async () => { throw new Error("boom"); } };
  const r = await tratarEnvio(base, { agora: AGORA, ipHash: "ip", repo });
  assert.deepEqual(r, { ok: false, erro: "Não consegui salvar agora. Tente de novo em instantes." });
});

test("chave da pessoa ignora acento, caixa e espaços", () => {
  assert.equal(chaveDaPessoa("  João   da  Silva ", "Gestão"), chaveDaPessoa("joao da silva", "Gestão"));
  assert.notEqual(chaveDaPessoa("Ana", "Gestão"), chaveDaPessoa("Ana", "Comercial"));
});
