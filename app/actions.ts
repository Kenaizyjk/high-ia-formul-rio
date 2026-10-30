"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { tratarEnvio, type Resultado } from "@/lib/envio";
import { garantirTabela, sql } from "@/lib/db";

function hashDoIp(ip: string): string {
  const sal = process.env.IP_SALT || process.env.PAINEL_SENHA || "sem-sal";
  return createHash("sha256").update(`${sal}|${ip}`).digest("hex").slice(0, 32);
}

export async function enviarRespostas(bruto: unknown): Promise<Resultado> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";

  return tratarEnvio(bruto, {
    agora: Date.now(),
    ipHash: hashDoIp(ip),
    log: (msg, detalhe) => console.error(msg, detalhe ?? ""),
    repo: {
      async contarRecentes(ipHash) {
        await garantirTabela();
        const [{ n }] = (await sql()`
          SELECT count(*)::int AS n FROM respostas
          WHERE ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'`) as { n: number }[];
        return n;
      },
      async inserir(l) {
        await garantirTabela();
        const d = l.pontuacao.dimensoes;
        await sql()`
          INSERT INTO respostas
            (nome, area, tempo, pessoa_chave, respostas, uso, dominio, responsabilidade, visao,
             total, nivel, ip_hash, suspeito)
          VALUES
            (${l.nome}, ${l.area}, ${l.tempo}, ${l.pessoaChave}, ${JSON.stringify(l.respostas)}::jsonb,
             ${d.uso}, ${d.dominio}, ${d.responsabilidade}, ${d.visao},
             ${l.pontuacao.total}, ${l.pontuacao.nivel}, ${l.ipHash}, ${l.suspeito})`;
      },
    },
  });
}
