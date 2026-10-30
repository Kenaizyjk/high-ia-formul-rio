import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "painel_sessao";

// O cookie carrega um HMAC derivado da senha, não a senha. Trocar PAINEL_SENHA invalida todas as sessões.
function seloEsperado(): string | null {
  const senha = process.env.PAINEL_SENHA;
  if (!senha) return null;
  return createHmac("sha256", senha).update("painel-v1").digest("hex");
}

function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function senhaConfere(tentativa: string): boolean {
  const senha = process.env.PAINEL_SENHA;
  if (!senha || !tentativa) return false;
  // compara os HMACs para igualar o tamanho antes do timingSafeEqual
  const k = "cmp";
  return iguais(
    createHmac("sha256", k).update(tentativa).digest("hex"),
    createHmac("sha256", k).update(senha).digest("hex"),
  );
}

export function seloDeSessao(): string | null {
  return seloEsperado();
}

export async function autenticado(): Promise<boolean> {
  const esperado = seloEsperado();
  if (!esperado) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && iguais(c, esperado);
}
