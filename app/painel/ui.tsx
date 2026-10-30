import type { ResumoGeral, ResumoPessoa, Resumo } from "@/lib/db";

export function Barra({ pct, destaque = true }: { pct: number; destaque?: boolean }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-borda" role="img" aria-label={`${pct}%`}>
      <div className={`h-full rounded-full ${destaque ? "bg-laranja" : "bg-suave"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Bloco({ titulo, children, destaque }: { titulo: string; children: React.ReactNode; destaque?: boolean }) {
  return (
    <section
      className={`rounded-3xl border p-5 sm:p-6 ${
        destaque ? "border-laranja bg-laranja/[0.07]" : "border-borda bg-superficie/80"
      }`}
    >
      <h2 className="mb-4 text-lg font-extrabold">{titulo}</h2>
      {children}
    </section>
  );
}

export function geradoEm(iso: string): string {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `gerado em ${g("day")}/${g("month")} ${g("hour")}h${g("minute")}`;
}

const SEM_RESUMO = "O resumo da IA aparece alguns minutos depois das primeiras respostas.";

function Lista({ itens }: { itens: string[] }) {
  if (!itens?.length) return <p className="text-suave">—</p>;
  return (
    <ul className="space-y-2">
      {itens.map((t, k) => (
        <li key={k} className="flex gap-3 leading-relaxed">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-laranja" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-laranja first:mt-0">{children}</h3>;
}

export function ResumoGeralView({ r }: { r: Resumo<ResumoGeral> | null }) {
  if (!r) {
    return (
      <Bloco titulo="Resumo da IA do time" destaque>
        <p className="text-suave">{SEM_RESUMO}</p>
      </Bloco>
    );
  }
  const c = r.conteudo;
  return (
    <Bloco titulo="Resumo da IA do time" destaque>
      <p className="-mt-3 mb-4 text-xs text-suave">{geradoEm(r.gerado_em)}</p>
      <p className="text-lg leading-relaxed">{c.retrato}</p>

      <Sub>Principais lacunas</Sub>
      <Lista itens={c.lacunas} />

      <Sub>Para a próxima aula</Sub>
      <ol className="space-y-3">
        {c.proxima_aula?.map((t, k) => (
          <li key={k} className="flex gap-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-laranja text-sm font-extrabold text-carvao">
              {k + 1}
            </span>
            <span className="leading-relaxed">
              <strong>{t.tema}.</strong> {t.porque}
            </span>
          </li>
        ))}
      </ol>

      <Sub>Grupos sugeridos</Sub>
      <ul className="space-y-3">
        {c.grupos?.map((g, k) => (
          <li key={k} className="rounded-2xl bg-carvao/60 p-4">
            <p className="font-bold">{g.nome}</p>
            <p className="mt-1 text-sm text-suave">{g.pessoas?.join(", ")}</p>
            <p className="mt-2 text-sm leading-relaxed">{g.precisam}</p>
          </li>
        ))}
      </ul>

      <Sub>Riscos</Sub>
      <Lista itens={c.riscos} />
    </Bloco>
  );
}

export function ResumoPessoaView({ r }: { r: Resumo<ResumoPessoa> | null }) {
  if (!r) {
    return (
      <Bloco titulo="Resumo da IA desta pessoa" destaque>
        <p className="text-suave">{SEM_RESUMO}</p>
      </Bloco>
    );
  }
  const c = r.conteudo;
  return (
    <Bloco titulo="Resumo da IA desta pessoa" destaque>
      <p className="-mt-3 mb-4 text-xs text-suave">{geradoEm(r.gerado_em)}</p>
      <Sub>Pontos fortes</Sub>
      <Lista itens={c.pontos_fortes} />
      <Sub>Lacunas</Sub>
      <Lista itens={c.lacunas} />
      <Sub>O que aprender a seguir</Sub>
      <Lista itens={c.aprender_a_seguir} />
      {c.cuidado && (
        <>
          <Sub>Um cuidado</Sub>
          <p className="leading-relaxed">{c.cuidado}</p>
        </>
      )}
    </Bloco>
  );
}
