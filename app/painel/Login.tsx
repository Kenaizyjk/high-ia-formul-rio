"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export default function Login() {
  const [estado, acao, pendente] = useActionState(entrar, null);
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm place-content-center px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/high-horizontal-branco.svg" alt="High Media" className="mb-8 h-7 w-auto" />
      <h1 className="text-2xl font-extrabold">Painel · Nível de IA</h1>
      <form action={acao} className="mt-6 space-y-4">
        <label className="block text-sm font-bold text-suave">
          Usuário
          <input
            name="usuario" type="text" autoFocus required autoComplete="username" autoCapitalize="none" spellCheck={false}
            className="mt-2 w-full rounded-2xl border border-borda bg-superficie px-5 py-4 text-lg text-texto focus:border-laranja focus:outline-none"
          />
        </label>
        <label className="block text-sm font-bold text-suave">
          Senha
          <input
            name="senha" type="password" required autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-borda bg-superficie px-5 py-4 text-lg text-texto focus:border-laranja focus:outline-none"
          />
        </label>
        {estado?.erro && <p role="alert" className="text-sm font-semibold text-laranja">{estado.erro}</p>}
        <button
          disabled={pendente}
          className="min-h-[52px] w-full rounded-2xl bg-laranja px-7 font-bold text-carvao disabled:opacity-50"
        >
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
