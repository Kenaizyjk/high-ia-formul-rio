import { CAMPO_ARMADILHA, EnvioSchema, mensagemDeErro } from "./schema.ts";
import { pontuar, type Pontuacao } from "./questions.ts";

export const TEMPO_MINIMO_MS = 25_000; // são ~17 telas; menos que isso não é gente
export const LIMITE_POR_HORA = 60; // o time responde do mesmo escritório (um IP só)

export type Resultado = { ok: true } | { ok: false; erro: string };

export type NovaLinha = {
  nome: string;
  area: string;
  tempo: string;
  pessoaChave: string;
  respostas: unknown;
  pontuacao: Pontuacao;
  ipHash: string;
  suspeito: boolean;
};

export type Repo = {
  contarRecentes(ipHash: string): Promise<number>;
  inserir(linha: NovaLinha): Promise<void>;
};

// "João  da Silva" e "joao da silva" são a mesma pessoa; a área entra na chave porque há homônimos.
export function chaveDaPessoa(nome: string, area: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `${limpo}|${area}`;
}

// Nunca descarta resposta de gente: o campo-armadilha só marca como suspeita.
// A defesa contra robô é o tempo mínimo e o limite por IP.
export async function tratarEnvio(
  bruto: unknown,
  ctx: { agora: number; ipHash: string; repo: Repo; log?: (msg: string, detalhe?: unknown) => void },
): Promise<Resultado> {
  const log = ctx.log ?? (() => {});
  const parsed = EnvioSchema.safeParse(bruto);
  if (!parsed.success) {
    log("envio inválido", parsed.error.issues.slice(0, 3));
    return { ok: false, erro: mensagemDeErro(parsed.error.issues[0]) };
  }
  const e = parsed.data;

  if (ctx.agora - e.iniciouEm < TEMPO_MINIMO_MS) {
    return { ok: false, erro: "Você respondeu rápido demais. Releia com calma e envie de novo." };
  }

  try {
    if ((await ctx.repo.contarRecentes(ctx.ipHash)) >= LIMITE_POR_HORA) {
      return { ok: false, erro: "Muitos envios deste dispositivo. Tente de novo daqui a pouco." };
    }
    await ctx.repo.inserir({
      nome: e.nome,
      area: e.area,
      tempo: e.tempo,
      pessoaChave: chaveDaPessoa(e.nome, e.area),
      respostas: e.respostas,
      pontuacao: pontuar(e.respostas),
      ipHash: ctx.ipHash,
      suspeito: (e[CAMPO_ARMADILHA] ?? "").trim() !== "",
    });
  } catch (err) {
    log("falha ao gravar resposta", err instanceof Error ? err.message : err);
    return { ok: false, erro: "Não consegui salvar agora. Tente de novo em instantes." };
  }
  return { ok: true };
}
