import { autenticado } from "@/lib/auth";
import { respostasVigentes } from "@/lib/db";
import { montarCsv, type LinhaP } from "@/lib/painel";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await autenticado())) return new Response("Não autorizado", { status: 401 });
  const linhas = (await respostasVigentes()) as unknown as LinhaP[];
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(montarCsv(linhas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nivel-de-ia-high-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
