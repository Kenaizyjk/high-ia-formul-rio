"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { EnvioSchema } from "@/lib/schema";
import { PERGUNTAS, pontuar, type Pontuacao } from "@/lib/questions";
import { garantirTabela, sql } from "@/lib/db";

const TEMPO_MINIMO_MS = 25_000; // são ~18 telas; menos que isso não é gente
const LIMITE_POR_HORA = 6;

export type Resultado =
  | { ok: true; pontuacao: Pontuacao }
  | { ok: false; erro: string };

function hashDoIp(ip: string): string {
  const sal = process.env.IP_SALT || process.env.PAINEL_SENHA || "sem-sal";
  return createHash("sha256").update(`${sal}|${ip}`).digest("hex").slice(0, 32);
}

export async function enviarRespostas(bruto: unknown): Promise<Resultado> {
  const parsed = EnvioSchema.safeParse(bruto);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const chave = String(issue?.path?.[1] ?? issue?.path?.[0] ?? "");
    const pergunta = PERGUNTAS.find((p) => p.id === chave);
    const erro = pergunta
      ? `Falta responder: ${pergunta.titulo}`
      : chave === "email"
        ? "E-mail inválido."
        : "Algumas respostas estão incompletas.";
    return { ok: false, erro };
  }
  const e = parsed.data;
  const pontuacao = pontuar(e.respostas);

  // Honeypot: finge sucesso para não ensinar o robô, mas não grava nada.
  if (e.empresa_site) return { ok: true, pontuacao };

  const decorrido = Date.now() - e.iniciouEm;
  if (decorrido < TEMPO_MINIMO_MS) {
    return { ok: false, erro: "Você respondeu rápido demais. Releia com calma e envie de novo." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";
  const ipHash = hashDoIp(ip);

  try {
    await garantirTabela();
    const db = sql();
    const [{ n }] = (await db`
      SELECT count(*)::int AS n FROM respostas
      WHERE ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'`) as { n: number }[];
    if (n >= LIMITE_POR_HORA) {
      return { ok: false, erro: "Muitos envios deste dispositivo. Tente de novo daqui a pouco." };
    }

    const d = pontuacao.dimensoes;
    await db`
      INSERT INTO respostas
        (nome, email, area, tempo, respostas, uso, dominio, responsabilidade, visao, total, nivel, ip_hash)
      VALUES
        (${e.nome}, ${e.email ?? null}, ${e.area}, ${e.tempo}, ${JSON.stringify(e.respostas)}::jsonb,
         ${d.uso}, ${d.dominio}, ${d.responsabilidade}, ${d.visao}, ${pontuacao.total}, ${pontuacao.nivel}, ${ipHash})`;
  } catch (err) {
    console.error("falha ao gravar resposta", err instanceof Error ? err.message : err);
    return { ok: false, erro: "Não consegui salvar agora. Tente de novo em instantes." };
  }

  return { ok: true, pontuacao };
}
