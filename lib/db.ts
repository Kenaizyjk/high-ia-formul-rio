import { neon } from "@neondatabase/serverless";

// A string de conexão vem do env da Vercel (DATABASE_URL, injetada pela integração Neon).
// Só o servidor importa este módulo; nada daqui vai para o navegador.
export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return neon(url);
}

let pronto: Promise<void> | null = null;

// Migração idempotente, executada na primeira chamada de cada instância.
// O job da VPS (/opt/formulario-ia) é quem escreve em resumos_ia; o site só lê.
export function garantirTabela(): Promise<void> {
  if (!pronto) {
    const db = sql();
    pronto = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS respostas (
          id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at  timestamptz NOT NULL DEFAULT now(),
          nome        text NOT NULL,
          email       text,
          area        text NOT NULL,
          tempo       text NOT NULL,
          respostas   jsonb NOT NULL,
          uso         int NOT NULL,
          dominio     int NOT NULL,
          responsabilidade int NOT NULL,
          visao       int NOT NULL,
          total       int NOT NULL,
          nivel       int NOT NULL,
          ip_hash     text
        )`;
      await db`ALTER TABLE respostas ADD COLUMN IF NOT EXISTS pessoa_chave text`;
      await db`ALTER TABLE respostas ADD COLUMN IF NOT EXISTS suspeito boolean NOT NULL DEFAULT false`;
      await db`CREATE INDEX IF NOT EXISTS respostas_created_idx ON respostas (created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS respostas_pessoa_idx ON respostas (pessoa_chave, created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS respostas_ip_idx ON respostas (ip_hash, created_at)`;
      await db`
        CREATE TABLE IF NOT EXISTS resumos_ia (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tipo          text NOT NULL CHECK (tipo IN ('geral', 'pessoa')),
          pessoa_chave  text,
          resposta_id   uuid,
          conteudo      jsonb NOT NULL,
          base_hash     text NOT NULL,
          modelo        text NOT NULL,
          gerado_em     timestamptz NOT NULL DEFAULT now()
        )`;
      await db`CREATE INDEX IF NOT EXISTS resumos_ia_busca_idx ON resumos_ia (tipo, pessoa_chave, gerado_em DESC)`;
    })().catch((e) => {
      pronto = null;
      throw e;
    });
  }
  return pronto;
}

export type Linha = {
  id: string;
  created_at: string;
  nome: string;
  area: string;
  tempo: string;
  respostas: Record<string, string | string[] | number | undefined>;
  uso: number;
  dominio: number;
  responsabilidade: number;
  visao: number;
  total: number;
  nivel: number;
  suspeito: boolean;
};

const COLUNAS = `id, created_at, nome, area, tempo, respostas, uso, dominio, responsabilidade, visao, total, nivel, suspeito`;

// Uma linha por pessoa: o envio mais recente. Os antigos continuam na tabela.
export async function respostasVigentes(): Promise<Linha[]> {
  await garantirTabela();
  const rows = (await sql().query(
    `SELECT DISTINCT ON (COALESCE(pessoa_chave, id::text)) ${COLUNAS}
     FROM respostas
     ORDER BY COALESCE(pessoa_chave, id::text), created_at DESC`,
  )) as unknown as Linha[];
  return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function respostaPorId(id: string): Promise<Linha | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await garantirTabela();
  const rows = (await sql().query(`SELECT ${COLUNAS} FROM respostas WHERE id = $1`, [id])) as unknown as Linha[];
  return rows[0] ?? null;
}

export type Resumo<T> = { conteudo: T; gerado_em: string; modelo: string };

export type ResumoGeral = {
  retrato: string;
  lacunas: string[];
  proxima_aula: { tema: string; porque: string }[];
  grupos: { nome: string; pessoas: string[]; precisam: string }[];
  riscos: string[];
};

export type ResumoPessoa = {
  pontos_fortes: string[];
  lacunas: string[];
  aprender_a_seguir: string[];
  cuidado: string | null;
};

export async function resumoGeral(): Promise<Resumo<ResumoGeral> | null> {
  await garantirTabela();
  const r = (await sql().query(
    `SELECT conteudo, gerado_em, modelo FROM resumos_ia WHERE tipo = 'geral' ORDER BY gerado_em DESC LIMIT 1`,
  )) as unknown as Resumo<ResumoGeral>[];
  return r[0] ?? null;
}

export async function resumoDaPessoa(chave: string | null): Promise<Resumo<ResumoPessoa> | null> {
  if (!chave) return null;
  await garantirTabela();
  const r = (await sql().query(
    `SELECT conteudo, gerado_em, modelo FROM resumos_ia
     WHERE tipo = 'pessoa' AND pessoa_chave = $1 ORDER BY gerado_em DESC LIMIT 1`,
    [chave],
  )) as unknown as Resumo<ResumoPessoa>[];
  return r[0] ?? null;
}

export async function chaveDaResposta(id: string): Promise<string | null> {
  const r = (await sql().query(`SELECT pessoa_chave FROM respostas WHERE id = $1`, [id])) as unknown as {
    pessoa_chave: string | null;
  }[];
  return r[0]?.pessoa_chave ?? null;
}
