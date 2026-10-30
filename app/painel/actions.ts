"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, entrarComCredenciais } from "@/lib/auth";

const MENSAGEM = "Usuário ou senha incorretos";

export async function entrar(_prev: { erro: string } | null, form: FormData): Promise<{ erro: string }> {
  const usuario = String(form.get("usuario") ?? "").slice(0, 64);
  const senha = String(form.get("senha") ?? "").slice(0, 200);
  const r = entrarComCredenciais(usuario, senha);
  if (!r.ok) {
    if (r.motivo === "config") console.error("painel: login sem configuração (PAINEL_USUARIOS/PAINEL_SEGREDO/PAINEL_SENHA)");
    await new Promise((res) => setTimeout(res, 800)); // freio simples contra tentativa em série
    return { erro: r.motivo === "config" ? "Painel indisponível no momento." : MENSAGEM };
  }
  (await cookies()).set(COOKIE, r.valorCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/painel",
    maxAge: 60 * 60 * 8,
  });
  redirect("/painel");
}

export async function sair() {
  (await cookies()).delete({ name: COOKIE, path: "/painel" });
  redirect("/painel");
}
