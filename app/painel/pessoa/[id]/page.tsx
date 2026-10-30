import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { autenticado } from "@/lib/auth";
import { chaveDaResposta, respostaPorId, resumoDaPessoa } from "@/lib/db";
import { DIMENSOES, NIVEIS, PERGUNTAS } from "@/lib/questions";
import Login from "../../Login";
import { Barra, Bloco, ResumoPessoaView } from "../../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pessoa · Nível de IA | High Media", robots: { index: false } };

function legivel(v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.join(" · ") : "—";
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
}

export default async function Pessoa({ params }: { params: Promise<{ id: string }> }) {
  if (!(await autenticado())) return <Login />;
  const { id } = await params;
  const r = await respostaPorId(id);
  if (!r) notFound();
  const resumo = await resumoDaPessoa(await chaveDaResposta(r.id));
  const data = new Date(r.created_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
  });

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
      <Link href="/painel" className="inline-flex min-h-[44px] items-center text-sm font-bold text-laranja">
        ← Voltar ao painel
      </Link>
      <header>
        <h1 className="text-3xl font-extrabold">{r.nome}</h1>
        <p className="mt-1 text-suave">
          {r.area} · {r.tempo} de High · respondeu em {data}
        </p>
        <p className="mt-3 inline-block rounded-full bg-laranja px-4 py-1 text-sm font-extrabold text-carvao">
          Nível {r.nivel} · {NIVEIS[r.nivel as 1 | 2 | 3 | 4]?.nome} · {r.total}/33
        </p>
        {r.suspeito && (
          <p className="ml-2 inline-block rounded-full border border-laranja px-3 py-1 text-xs font-bold text-laranja">
            Marcada como suspeita (campo-armadilha preenchido)
          </p>
        )}
      </header>

      <ResumoPessoaView r={resumo} />

      <Bloco titulo="Dimensões">
        <ul className="space-y-4">
          {DIMENSOES.map((d) => {
            const pct = Math.round((r[d.id] / d.max) * 100);
            return (
              <li key={d.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{d.nome}</span>
                  <span className="font-bold">{pct}% ({r[d.id]}/{d.max})</span>
                </div>
                <Barra pct={pct} />
              </li>
            );
          })}
        </ul>
      </Bloco>

      <Bloco titulo="Todas as respostas">
        <dl className="space-y-4">
          {PERGUNTAS.map((p, k) => (
            <div key={p.id}>
              <dt className="text-sm text-suave">{k + 1}. {p.titulo}</dt>
              <dd className="mt-1 font-semibold leading-relaxed">{legivel(r.respostas[p.id])}</dd>
            </div>
          ))}
        </dl>
      </Bloco>
    </main>
  );
}
