import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "@/db";
import { gastos } from "@/db/schema";

export type Gasto = typeof gastos.$inferSelect;

export const TIPOS_PAGAMENTO = ["pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"];
export const CATEGORIAS = ["ingredientes", "embalagem", "mercado", "confeitaria", "outro"];

export async function listarGastos(): Promise<Gasto[]> {
  return db.select().from(gastos).orderBy(desc(gastos.data));
}

export async function buscarGasto(id: number): Promise<Gasto | undefined> {
  const rows = await db.select().from(gastos).where(eq(gastos.id, id));
  return rows[0];
}

export async function adicionarGasto(dados: {
  nome: string;
  data: string;
  tipoPagamento?: string | null;
  categoria?: string | null;
  valor: number;
}) {
  const [row] = await db.insert(gastos).values(dados).returning();
  return row;
}

export async function atualizarGasto(
  id: number,
  dados: { nome: string; data: string; tipoPagamento?: string | null; categoria?: string | null; valor: number }
) {
  await db.update(gastos).set(dados).where(eq(gastos.id, id));
}

export async function removerGasto(id: number) {
  await db.delete(gastos).where(eq(gastos.id, id));
}

export async function filtrarGastos(dataInicio?: string, dataFim?: string): Promise<Gasto[]> {
  const condicoes = [];
  if (dataInicio) condicoes.push(gte(gastos.data, dataInicio));
  if (dataFim) condicoes.push(lte(gastos.data, dataFim));
  const query = db.select().from(gastos);
  const withWhere = condicoes.length ? query.where(and(...condicoes)) : query;
  return withWhere.orderBy(desc(gastos.data));
}

export async function totalGastos(dataInicio?: string, dataFim?: string): Promise<number> {
  const itens = await filtrarGastos(dataInicio, dataFim);
  return itens.reduce((total, g) => total + g.valor, 0);
}

export async function resumoPorCategoria(dataInicio?: string, dataFim?: string) {
  const itens = await filtrarGastos(dataInicio, dataFim);
  const totais = new Map<string, number>();
  for (const g of itens) {
    const chave = g.categoria ?? "sem categoria";
    totais.set(chave, (totais.get(chave) ?? 0) + g.valor);
  }
  return [...totais.entries()].sort((a, b) => b[1] - a[1]);
}

export async function resumoPorTipoPagamento(dataInicio?: string, dataFim?: string) {
  const itens = await filtrarGastos(dataInicio, dataFim);
  const totais = new Map<string, number>();
  for (const g of itens) {
    const chave = g.tipoPagamento ?? "sem forma";
    totais.set(chave, (totais.get(chave) ?? 0) + g.valor);
  }
  return [...totais.entries()].sort((a, b) => b[1] - a[1]);
}
