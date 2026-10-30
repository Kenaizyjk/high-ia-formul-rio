import { z } from "zod";
import { AREAS, FERRAMENTAS, PERGUNTAS, TEMPOS, TRAVAS, USOS, TREINAMENTO } from "./questions";

const escala = z.number().int().min(1).max(5);

function opcoesUnica(id: string): [string, ...string[]] {
  const p = PERGUNTAS.find((x) => x.id === id);
  if (!p || p.tipo !== "unica") throw new Error(`pergunta ${id} inválida`);
  return p.opcoes.map((o) => o.texto) as [string, ...string[]];
}

const multipla = (lista: readonly string[], max: number) =>
  z.array(z.enum(lista as [string, ...string[]])).min(1).max(max);

export const EnvioSchema = z.object({
  nome: z.string().trim().min(2, "Conta seu nome").max(80),
  email: z
    .string()
    .trim()
    .max(120)
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
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
  // honeypot: campo invisível que humano não preenche
  empresa_site: z.string().max(0).optional().default(""),
  // instante (ms epoch) em que a pessoa clicou em "Começar"
  iniciouEm: z.number().int().positive(),
});

export type Envio = z.infer<typeof EnvioSchema>;
