import { neon } from "@neondatabase/serverless";

// A string de conexão vem do env da Vercel (DATABASE_URL, injetada pela integração Neon).
// Só o servidor importa este módulo; nada daqui vai para o navegador.
function conexao() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return neon(url);
}

let pronto: Promise<void> | null = null;

export function sql() {
  return conexao();
}

// Cria a tabela na primeira chamada de cada instância. É idempotente.
export function garantirTabela(): Promise<void> {
  if (!pronto) {
    const db = conexao();
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
      await db`CREATE INDEX IF NOT EXISTS respostas_created_idx ON respostas (created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS respostas_email_idx ON respostas (lower(email))`;
      await db`CREATE INDEX IF NOT EXISTS respostas_ip_idx ON respostas (ip_hash, created_at)`;
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
  email: string | null;
  area: string;
  tempo: string;
  respostas: Record<string, string | string[] | number | undefined>;
  uso: number;
  dominio: number;
  responsabilidade: number;
  visao: number;
  total: number;
  nivel: number;
};

// Painel: se a pessoa reenviou com o mesmo e-mail, vale o envio mais recente.
// Sem e-mail, cada envio é uma resposta distinta.
export async function respostasVigentes(): Promise<Linha[]> {
  await garantirTabela();
  const db = sql();
  const rows = await db`
    SELECT DISTINCT ON (COALESCE(lower(email), id::text))
      id, created_at, nome, email, area, tempo, respostas,
      uso, dominio, responsabilidade, visao, total, nivel
    FROM respostas
    ORDER BY COALESCE(lower(email), id::text), created_at DESC`;
  return (rows as unknown as Linha[]).sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
}
