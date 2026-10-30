import type { Metadata } from "next";
import { autenticado } from "@/lib/auth";
import Link from "next/link";
import { respostasVigentes, resumoGeral, type Resumo, type ResumoGeral } from "@/lib/db";
import { DIMENSOES, NIVEIS, TRAVAS, type Dimensao } from "@/lib/questions";
import {
  contarMultipla,
  distribuicaoNivel,
  mediasPorArea,
  mediasPorDimensao,
  type LinhaP,
} from "@/lib/painel";
import Login from "./Login";
import { sair } from "./actions";
import { Barra, Bloco, ResumoGeralView } from "./ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel · Nível de IA | High Media", robots: { index: false } };

function Ranking({ itens, total }: { itens: [string, number][]; total: number }) {
  if (itens.length === 0) return <p className="text-suave">Sem respostas ainda.</p>;
  return (
    <ul className="space-y-3">
      {itens.map(([nome, n]) => (
        <li key={nome}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="font-semibold">{nome}</span>
            <span className="shrink-0 font-bold">{n} ({Math.round((n / total) * 100)}%)</span>
          </div>
          <Barra pct={Math.round((n / total) * 100)} />
        </li>
      ))}
    </ul>
  );
}

export default async function Painel() {
  if (!(await autenticado())) return <Login />;

  let linhas: LinhaP[] = [];
  let falha = "";
  let resumo: Resumo<ResumoGeral> | null = null;
  try {
    linhas = (await respostasVigentes()) as unknown as LinhaP[];
    resumo = await resumoGeral();
  } catch (e) {
    console.error("painel: falha ao ler respostas", e instanceof Error ? e.message : e);
    falha = "Não consegui ler o banco agora. Recarregue a página.";
  }

  const n = linhas.length;
  const dist = distribuicaoNivel(linhas);
  const medias = mediasPorDimensao(linhas);
  const porArea = mediasPorArea(linhas);
  const ferramentas = contarMultipla(linhas, "q2", ["Nenhuma"]).slice(0, 8);
  const travas = contarMultipla(linhas, "q13", ["Nada me trava"]).filter(([t]) => (TRAVAS as readonly string[]).includes(t));
  const abertas = linhas.filter((l) => typeof l.respostas.q14 === "string" && l.respostas.q14.trim() !== "");
  const topam = linhas.filter((l) => l.respostas.q15 === "Sim");
  const talvez = linhas.filter((l) => l.respostas.q15 === "Talvez");
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/high-horizontal-branco.svg" alt="High Media" className="mb-3 h-6 w-auto" />
          <h1 className="text-3xl font-extrabold">Nível de IA do time</h1>
        </div>
        <div className="flex gap-3">
          <a
            href="/painel/csv" download
            className="inline-flex min-h-[44px] items-center rounded-xl bg-laranja px-5 text-sm font-bold text-carvao"
          >
            Baixar CSV
          </a>
          <form action={sair}>
            <button className="min-h-[44px] rounded-xl border border-borda px-5 text-sm font-bold">Sair</button>
          </form>
        </div>
      </header>

      {falha && <p role="alert" className="rounded-xl border border-laranja bg-laranja/10 px-4 py-3 font-semibold">{falha}</p>}

      <ResumoGeralView r={resumo} />

      <div className="grid gap-5 md:grid-cols-3">
        <Bloco titulo="Pessoas que responderam">
          <p className="text-6xl font-extrabold text-laranja">{n}</p>
          <p className="mt-1 text-sm text-suave">Uma linha por pessoa: se a mesma pessoa reenviou (mesmo nome e área), vale o envio mais recente.</p>
        </Bloco>
        <div className="md:col-span-2">
          <Bloco titulo="Distribuição por nível">
            <ul className="space-y-3">
              {([1, 2, 3, 4] as const).map((k) => (
                <li key={k}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">Nível {k} · {NIVEIS[k].nome}</span>
                    <span className="font-bold">{dist[k]}</span>
                  </div>
                  <Barra pct={n ? Math.round((dist[k] / n) * 100) : 0} />
                </li>
              ))}
            </ul>
          </Bloco>
        </div>
      </div>

      <Bloco titulo="Média de cada dimensão (% do máximo)">
        <ul className="grid gap-4 sm:grid-cols-2">
          {DIMENSOES.map((d) => (
            <li key={d.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{d.nome}</span>
                <span className="font-bold">{medias[d.id]}%</span>
              </div>
              <Barra pct={medias[d.id]} />
            </li>
          ))}
        </ul>
        {porArea.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="mb-2 text-left font-bold">Por área</caption>
              <thead className="text-suave">
                <tr>
                  <th className="py-2 pr-3">Área</th>
                  <th className="px-3">Pessoas</th>
                  {DIMENSOES.map((d) => <th key={d.id} className="px-3">{d.nome}</th>)}
                </tr>
              </thead>
              <tbody>
                {porArea.map((a) => (
                  <tr key={a.area} className="border-t border-borda">
                    <td className="py-2 pr-3 font-semibold">{a.area}</td>
                    <td className="px-3">{a.n}</td>
                    {DIMENSOES.map((d) => <td key={d.id} className="px-3">{a.medias[d.id as Dimensao]}%</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>

      <div className="grid gap-5 md:grid-cols-2">
        <Bloco titulo="Ferramentas mais usadas"><Ranking itens={ferramentas} total={n || 1} /></Bloco>
        <Bloco titulo="O que mais trava o time"><Ranking itens={travas} total={n || 1} /></Bloco>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Bloco titulo={`Tarefas que queriam delegar à IA (${abertas.length})`}>
          {abertas.length === 0 ? (
            <p className="text-suave">Nenhuma resposta aberta ainda.</p>
          ) : (
            <ul className="space-y-3">
              {abertas.map((l, k) => (
                <li key={k} className="rounded-xl bg-carvao/60 p-3">
                  <p>{String(l.respostas.q14)}</p>
                  <p className="mt-1 text-xs text-suave">{l.nome} · {l.area}</p>
                </li>
              ))}
            </ul>
          )}
        </Bloco>
        <Bloco titulo="Quem topa treinamento">
          <p className="mb-2 text-sm font-bold">Sim ({topam.length})</p>
          <p className="mb-4 text-sm">{topam.map((l) => l.nome).join(", ") || "—"}</p>
          <p className="mb-2 text-sm font-bold">Talvez ({talvez.length})</p>
          <p className="text-sm">{talvez.map((l) => l.nome).join(", ") || "—"}</p>
        </Bloco>
      </div>

      <Bloco titulo="Pessoas">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-suave">
              <tr>
                <th className="py-2 pr-3">Nome</th><th className="px-3">Área</th>
                <th className="px-3">Nível</th><th className="px-3">Data</th><th className="px-3"><span className="sr-only">Perfil</span></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-t border-borda">
                  <td className="py-3 pr-3 font-semibold">
                    {l.nome}
                    {l.suspeito && (
                      <span title="Campo-armadilha preenchido" className="ml-2 rounded-full border border-laranja px-2 py-0.5 text-xs font-bold text-laranja">
                        suspeita
                      </span>
                    )}
                  </td>
                  <td className="px-3">{l.area}</td>
                  <td className="px-3 whitespace-nowrap">{l.nivel} · {NIVEIS[l.nivel as 1 | 2 | 3 | 4]?.nome}</td>
                  <td className="whitespace-nowrap px-3">{fmt(l.created_at)}</td>
                  <td className="px-3">
                    <Link href={`/painel/pessoa/${l.id}`} className="inline-flex min-h-[44px] items-center font-bold text-laranja">
                      Ver perfil →
                    </Link>
                  </td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-suave">Nenhuma resposta ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Bloco>
    </main>
  );
}
