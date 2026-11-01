import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { pagamentos } from "@/db/schema";

export type Pagamento = typeof pagamentos.$inferSelect;

export async function listarPagamentosDoPedido(pedidoId: number): Promise<Pagamento[]> {
  return db.select().from(pagamentos).where(eq(pagamentos.pedidoId, pedidoId)).orderBy(pagamentos.data);
}

export async function adicionarPagamento(pedidoId: number, valor: number, data: string, observacoes?: string | null) {
  await db.insert(pagamentos).values({ pedidoId, valor, data, observacoes: observacoes ?? null });
}

export async function removerPagamento(id: number) {
  await db.delete(pagamentos).where(eq(pagamentos.id, id));
}

export async function totalRecebidoPedido(pedidoId: number): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)` })
    .from(pagamentos)
    .where(eq(pagamentos.pedidoId, pedidoId));
  return total;
}

// Soma de todos os pagamentos ja recebidos ate hoje (saldo de caixa total,
// independente de quando a venda foi feita).
export async function totalRecebidoGeral(): Promise<number> {
  const [{ total }] = await db.select({ total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)` }).from(pagamentos);
  return total;
}

// Pagamentos recebidos dentro de um periodo (pela DATA DO PAGAMENTO, nao da
// venda) - e o que alimenta o fluxo de caixa real do mes.
export async function listarPagamentosNoPeriodo(dataInicio: string, dataFim: string) {
  return db
    .select()
    .from(pagamentos)
    .where(and(gte(pagamentos.data, dataInicio), lte(pagamentos.data, dataFim)));
}
