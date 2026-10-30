import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirLogin, criarCookie, gerarHash, lerUsuarios, nomeParaExibir, usuarioDoCookie } from "./sessao.ts";

// Senhas e segredo só de teste, geradas aqui. Nada disto é credencial real.
const SEGREDO = "segredo-de-teste-0123456789abcdef";
const usuarios = {
  davi: gerarHash("senha-do-davi-teste"),
  junior: gerarHash("senha-do-junior-teste"),
};

test("login certo de cada usuário (maiúscula e espaços não importam)", () => {
  assert.equal(conferirLogin(usuarios, "davi", "senha-do-davi-teste"), "davi");
  assert.equal(conferirLogin(usuarios, "junior", "senha-do-junior-teste"), "junior");
  assert.equal(conferirLogin(usuarios, "  Junior ", "senha-do-junior-teste"), "junior");
});

test("senha errada, senha de outro usuário e usuário inexistente falham do mesmo jeito", () => {
  assert.equal(conferirLogin(usuarios, "junior", "errada"), null);
  assert.equal(conferirLogin(usuarios, "junior", "senha-do-davi-teste"), null);
  assert.equal(conferirLogin(usuarios, "ninguem", "senha-do-davi-teste"), null);
  assert.equal(conferirLogin(usuarios, "__proto__", "x"), null);
  assert.equal(conferirLogin(usuarios, "constructor", "x"), null);
  assert.equal(conferirLogin(usuarios, "", ""), null);
});

test("usuário inexistente também gasta um scrypt (sem atalho de tempo)", () => {
  const t = (u: string) => {
    const a = process.hrtime.bigint();
    conferirLogin(usuarios, u, "x");
    return Number(process.hrtime.bigint() - a) / 1e6;
  };
  t("junior"); // aquece
  const existe = Math.min(t("junior"), t("junior"), t("junior"));
  const naoExiste = Math.min(t("ninguem"), t("ninguem"), t("ninguem"));
  assert.ok(naoExiste > existe * 0.4, `inexistente ${naoExiste}ms vs existente ${existe}ms`);
});

test("cookie válido devolve o usuário", () => {
  const c = criarCookie(usuarios, SEGREDO, "junior");
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, c), "junior");
});

test("cookie adulterado é recusado", () => {
  const c = criarCookie(usuarios, SEGREDO, "junior");
  const [u, assin] = [c.slice(0, c.lastIndexOf(".")), c.slice(c.lastIndexOf(".") + 1)];
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, `${u}.${assin.replace(/.$/, assin.endsWith("0") ? "1" : "0")}`), null);
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, `davi.${assin}`), null); // troca de usuário com a assinatura do outro
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, `${u}.`), null);
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, assin), null);
  assert.equal(usuarioDoCookie(usuarios, SEGREDO, undefined), null);
  assert.equal(usuarioDoCookie(usuarios, "outro-segredo", c), null);
});

test("cookie de usuário removido ou de senha trocada deixa de valer, sem derrubar os outros", () => {
  const cJ = criarCookie(usuarios, SEGREDO, "junior");
  const cD = criarCookie(usuarios, SEGREDO, "davi");
  const semJunior = { davi: usuarios.davi };
  assert.equal(usuarioDoCookie(semJunior, SEGREDO, cJ), null);
  assert.equal(usuarioDoCookie(semJunior, SEGREDO, cD), "davi");
  const novaSenha = { ...usuarios, junior: gerarHash("senha-nova") };
  assert.equal(usuarioDoCookie(novaSenha, SEGREDO, cJ), null);
  assert.equal(usuarioDoCookie(novaSenha, SEGREDO, cD), "davi");
});

test("lerUsuarios aceita só JSON de objeto com nomes válidos", () => {
  assert.equal(lerUsuarios(undefined), null);
  assert.equal(lerUsuarios("não é json"), null);
  assert.equal(lerUsuarios("[]"), null);
  assert.deepEqual(Object.keys(lerUsuarios(JSON.stringify(usuarios)) ?? {}), ["davi", "junior"]);
  assert.equal(lerUsuarios(JSON.stringify({ "a b": "x" })), null);
});

test("hash mal formado nunca autentica", () => {
  assert.equal(conferirLogin({ davi: "texto-puro" }, "davi", "texto-puro"), null);
  assert.equal(conferirLogin({ davi: "scrypt$$" }, "davi", ""), null);
});

test("nome de exibição", () => {
  assert.equal(nomeParaExibir("junior"), "Junior");
});
