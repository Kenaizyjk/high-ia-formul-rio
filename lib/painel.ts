import { DIMENSOES, type Dimensao } from "./questions.ts";

export type LinhaP = {
  id?: string;
  suspeito?: boolean;
  nome: string;
  area: string;
  tempo: string;
  respostas: Record<string, unknown>;
  uso: number;
  dominio: number;
  responsabilidade: number;
  visao: number;
  total: number;
  nivel: number;
  created_at: string;
};

const pct = (soma: number, n: number, max: number) => (n === 0 ? 0 : Math.round((soma / n / max) * 100));

export function mediasPorDimensao(linhas: LinhaP[]): Record<Dimensao, number> {
  const out = {} as Record<Dimensao, number>;
  for (const d of DIMENSOES) out[d.id] = pct(linhas.reduce((s, l) => s + l[d.id], 0), linhas.length, d.max);
  return out;
}

export function mediasPorArea(linhas: LinhaP[]) {
  const grupos = new Map<string, LinhaP[]>();
  for (const l of linhas) grupos.set(l.area, [...(grupos.get(l.area) ?? []), l]);
  return [...grupos.entries()]
    .map(([area, ls]) => ({ area, n: ls.length, medias: mediasPorDimensao(ls) }))
    .sort((a, b) => b.n - a.n);
}

export function distribuicaoNivel(linhas: LinhaP[]): Record<1 | 2 | 3 | 4, number> {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const l of linhas) if (l.nivel in out) out[l.nivel as 1 | 2 | 3 | 4]++;
  return out;
}

export function contarMultipla(linhas: LinhaP[], id: string, ignorar: string[] = []) {
  const c = new Map<string, number>();
  for (const l of linhas) {
    const v = l.respostas[id];
    if (!Array.isArray(v)) continue;
    for (const o of v) if (typeof o === "string" && !ignorar.includes(o)) c.set(o, (c.get(o) ?? 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

// Células que o Excel/Sheets interpretariam como fórmula ganham um apóstrofo na frente.
export function celulaCsv(valor: unknown): string {
  let s = valor == null ? "" : Array.isArray(valor) ? valor.join(" | ") : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const COLUNAS_CSV = [
  "Data", "Nome", "Área", "Tempo de High", "Nível", "Total",
  "Uso", "Domínio", "Responsabilidade", "Visão",
  "Frequência", "Ferramentas", "Para que usa", "Entende de IA (1-5)", "Como pede", "Número da IA",
  "Alucinação", "Dados de cliente", "Privacidade das ferramentas", "Tempo economizado",
  "Automação/GPT/agente", "Impacto em 12 meses (1-5)", "O que trava", "Tarefa que queria delegar", "Treinamento", "Suspeito",
];

export function linhaCsv(l: LinhaP): string {
  const r = l.respostas;
  const data = new Date(l.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return [
    data, l.nome, l.area, l.tempo, l.nivel, l.total, l.uso, l.dominio, l.responsabilidade, l.visao,
    r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8, r.q9, r.q10, r.q11, r.q12, r.q13, r.q14, r.q15, l.suspeito ? "sim" : "",
  ].map(celulaCsv).join(";");
}

export function montarCsv(linhas: LinhaP[]): string {
  return "﻿" + [COLUNAS_CSV.map(celulaCsv).join(";"), ...linhas.map(linhaCsv)].join("\r\n") + "\r\n";
}
