import { z } from "zod";
import { AREAS, FERRAMENTAS, PERGUNTAS, TEMPOS, TRAVAS, USOS, TREINAMENTO } from "./questions.ts";

const escala = z.number().int().min(1).max(5);

function opcoesUnica(id: string): [string, ...string[]] {
  const p = PERGUNTAS.find((x) => x.id === id);
  if (!p || p.tipo !== "unica") throw new Error(`pergunta ${id} inválida`);
  return p.opcoes.map((o) => o.texto) as [string, ...string[]];
}

const multipla = (lista: readonly string[], max: number) =>
  z.array(z.enum(lista as [string, ...string[]])).min(1).max(max);

// Nome do campo-armadilha. Sem "site", "empresa", "email" ou "nome": o autopreenchimento
// do navegador casa por palavra no name, id, rótulo e placeholder.
export const CAMPO_ARMADILHA = "xq7k2m";

export const EnvioSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  area: z.enum(AREAS),
  tempo: z.enum(TEMPOS),
  respostas: z.object({
    q1: z.enum(opcoesUnica("q1")),
    q2: multipla(FERRAMENTAS, FERRAMENTAS.length),
    q3: multipla(USOS, USOS.length),
    q4: escala,
    q5: z.enum(opcoesUnica("q5")),
    q6: z.enum(opcoesUnica("q6")),
    q7: z.enum(opcoesUnica("q7")),
    q8: z.enum(opcoesUnica("q8")),
    q9: z.enum(opcoesUnica("q9")),
    q10: z.enum(opcoesUnica("q10")),
    q11: z.enum(opcoesUnica("q11")),
    q12: escala,
    q13: multipla(TRAVAS, TRAVAS.length),
    q14: z.string().trim().max(600).optional().or(z.literal("").transform(() => undefined)),
    q15: z.enum(TREINAMENTO),
  }),
  // Armadilha: aceita qualquer texto e NUNCA gera erro. Se vier preenchida, a resposta é gravada como suspeita.
  [CAMPO_ARMADILHA]: z.string().max(500).optional().default("").catch(""),
  // instante (ms epoch) em que a pessoa clicou em "Começar"
  iniciouEm: z.number().int().positive(),
});

export type Envio = z.infer<typeof EnvioSchema>;

// Mensagem em português para o primeiro erro do zod. O detalhe técnico vai só para o log do servidor.
export function mensagemDeErro(issue: { path: PropertyKey[] } | undefined): string {
  const raiz = String(issue?.path?.[0] ?? "");
  const sub = String(issue?.path?.[1] ?? "");
  if (raiz === "respostas") {
    const n = /^q(\d+)$/.exec(sub)?.[1];
    if (n) return `Faltou responder a pergunta ${n}.`;
  }
  if (raiz === "nome") return "Faltou preencher o seu nome.";
  if (raiz === "area") return "Faltou escolher a sua área.";
  if (raiz === "tempo") return "Faltou escolher há quanto tempo você está na High.";
  return "Algumas respostas estão incompletas. Volte e confira.";
}
