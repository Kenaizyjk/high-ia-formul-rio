// Lógica pura de login e sessão do painel (sem next/headers), para poder ser testada.
// Usuários: {"usuario": "scrypt$<sal base64>$<hash base64>"}, scrypt N=16384 r=8 p=1 dklen=32.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type Usuarios = Record<string, string>;

const SCRYPT = { N: 16384, r: 8, p: 1 } as const;
const DKLEN = 32;

// Hash de mentira: usuário inexistente também paga o custo de um scrypt, para o tempo não denunciar.
const SAL_FALSO = randomBytes(16);

export function gerarHash(senha: string, sal: Buffer = randomBytes(16)): string {
  const h = scryptSync(senha, sal, DKLEN, SCRYPT);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

function iguais(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

function conferirSenha(armazenado: string, senha: string): boolean {
  const [alg, salB64, hashB64] = armazenado.split("$");
  if (alg !== "scrypt" || !salB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64");
  const obtido = scryptSync(senha, Buffer.from(salB64, "base64"), esperado.length || DKLEN, SCRYPT);
  return iguais(obtido, esperado);
}

export function normalizarUsuario(u: string): string {
  return u.trim().toLowerCase();
}

export function lerUsuarios(json: string | undefined): Usuarios | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const out: Usuarios = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && /^[a-z0-9_-]{1,32}$/.test(normalizarUsuario(k))) out[normalizarUsuario(k)] = v;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

// Devolve o nome normalizado do usuário se usuário e senha conferem; senão null.
// Sempre faz um scrypt, exista o usuário ou não.
export function conferirLogin(usuarios: Usuarios, usuarioBruto: string, senha: string): string | null {
  const usuario = normalizarUsuario(usuarioBruto);
  const hash = Object.hasOwn(usuarios, usuario) ? usuarios[usuario] : undefined;
  if (!hash) {
    scryptSync(senha, SAL_FALSO, DKLEN, SCRYPT);
    return null;
  }
  return conferirSenha(hash, senha) ? usuario : null;
}

// assinatura = HMAC-SHA256(segredo, usuario + "|" + hash do usuário): trocar a senha ou tirar o
// usuário derruba só a sessão dele.
function assinatura(segredo: string, usuario: string, hash: string): string {
  return createHmac("sha256", segredo).update(`${usuario}|${hash}`).digest("hex");
}

export function criarCookie(usuarios: Usuarios, segredo: string, usuario: string): string {
  return `${usuario}.${assinatura(segredo, usuario, usuarios[usuario])}`;
}

export function usuarioDoCookie(usuarios: Usuarios, segredo: string, cookie: string | undefined): string | null {
  if (!cookie) return null;
  const i = cookie.lastIndexOf(".");
  if (i < 1) return null;
  const usuario = cookie.slice(0, i);
  const assin = cookie.slice(i + 1);
  const hash = Object.hasOwn(usuarios, usuario) ? usuarios[usuario] : undefined;
  if (!hash) return null;
  const esperado = Buffer.from(assinatura(segredo, usuario, hash));
  return iguais(Buffer.from(assin), esperado) ? usuario : null;
}

export function nomeParaExibir(usuario: string): string {
  return usuario.charAt(0).toUpperCase() + usuario.slice(1);
}
