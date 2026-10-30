"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, senhaConfere, seloDeSessao } from "@/lib/auth";

export async function entrar(_prev: { erro: string } | null, form: FormData): Promise<{ erro: string }> {
  const senha = String(form.get("senha") ?? "");
  const selo = seloDeSessao();
  if (!selo) return { erro: "Painel sem senha configurada." };
  if (!senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 800)); // freio simples contra tentativa em série
    return { erro: "Senha incorreta." };
  }
  (await cookies()).set(COOKIE, selo, {
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
