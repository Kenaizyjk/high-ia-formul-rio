import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { conferirLogin, criarCookie, lerUsuarios, usuarioDoCookie, type Usuarios } from "./sessao";

export const COOKIE = "painel_sessao";

function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// --- modo por usuário (PAINEL_USUARIOS + PAINEL_SEGREDO) ---------------------------------------

function usuarios(): Usuarios | null {
  return lerUsuarios(process.env.PAINEL_USUARIOS);
}

// --- modo antigo (só PAINEL_SENHA), usado apenas se PAINEL_USUARIOS não existir ----------------

function seloAntigo(): string | null {
  const senha = process.env.PAINEL_SENHA;
  if (!senha) return null;
  return createHmac("sha256", senha).update("painel-v1").digest("hex");
}

function senhaAntigaConfere(tentativa: string): boolean {
  const senha = process.env.PAINEL_SENHA;
  if (!senha || !tentativa) return false;
  const k = "cmp";
  return iguais(
    createHmac("sha256", k).update(tentativa).digest("hex"),
    createHmac("sha256", k).update(senha).digest("hex"),
  );
}

export type Entrada = { ok: true; valorCookie: string } | { ok: false; motivo: "credenciais" | "config" };

// Confere usuário e senha e devolve o valor do cookie de sessão.
export function entrarComCredenciais(usuario: string, senha: string): Entrada {
  const us = usuarios();
  if (us) {
    const segredo = process.env.PAINEL_SEGREDO;
    if (!segredo) return { ok: false, motivo: "config" };
    const nome = conferirLogin(us, usuario, senha);
    return nome ? { ok: true, valorCookie: criarCookie(us, segredo, nome) } : { ok: false, motivo: "credenciais" };
  }
  const selo = seloAntigo();
  if (!selo) return { ok: false, motivo: "config" };
  return senhaAntigaConfere(senha) ? { ok: true, valorCookie: selo } : { ok: false, motivo: "credenciais" };
}

// Usuário da sessão atual, ou null. No modo antigo devolve "painel".
export async function sessaoAtual(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  const us = usuarios();
  if (us) {
    const segredo = process.env.PAINEL_SEGREDO;
    return segredo ? usuarioDoCookie(us, segredo, c) : null;
  }
  const selo = seloAntigo();
  return selo && c && iguais(c, selo) ? "painel" : null;
}

export async function autenticado(): Promise<boolean> {
  return (await sessaoAtual()) !== null;
}
