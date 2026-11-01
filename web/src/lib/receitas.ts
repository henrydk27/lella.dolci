import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { receitas, receitaIngredientes, ingredientes, GRUPOS_RECEITA, type GrupoReceita } from "@/db/schema";

export type Receita = typeof receitas.$inferSelect;
export { GRUPOS_RECEITA };
export type { GrupoReceita };

export async function listarReceitas(): Promise<Receita[]> {
  return db.select().from(receitas).orderBy(asc(receitas.nome));
}

export async function buscarReceita(id: number): Promise<Receita | undefined> {
  const rows = await db.select().from(receitas).where(eq(receitas.id, id));
  return rows[0];
}

interface DadosReceita {
  nome: string;
  grupo: GrupoReceita;
  pesoUnidadeGramas?: number | null;
  rendimento: number;
  observacoes?: string | null;
}

export async function adicionarReceita(dados: DadosReceita) {
  const [row] = await db.insert(receitas).values(dados).returning();
  return row;
}

export async function atualizarReceita(id: number, dados: DadosReceita) {
  await db.update(receitas).set(dados).where(eq(receitas.id, id));
}

export async function removerReceita(id: number) {
  await db.delete(receitas).where(eq(receitas.id, id));
}

export async function listarIngredientesDaReceita(receitaId: number) {
  return db
    .select({
      id: receitaIngredientes.id,
      nome: ingredientes.nome,
      gramasUsadas: receitaIngredientes.gramasUsadas,
      precoPorGrama: ingredientes.precoUnitario,
    })
    .from(receitaIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, receitaIngredientes.ingredienteId))
    .where(eq(receitaIngredientes.receitaId, receitaId));
}

export async function adicionarIngredienteNaReceita(receitaId: number, ingredienteId: number, gramasUsadas: number) {
  await db.insert(receitaIngredientes).values({ receitaId, ingredienteId, gramasUsadas });
}

export async function removerIngredienteDaReceita(relacaoId: number) {
  await db.delete(receitaIngredientes).where(eq(receitaIngredientes.id, relacaoId));
}

export interface CustoReceita {
  custoIngredientes: number;
  precoPorUnidade: number;
}

// Sempre recalculado na hora a partir do preco ATUAL dos ingredientes -
// nunca guardado - para acompanhar automaticamente qualquer reajuste de
// preco sem precisar editar a receita.
export async function calcularCustoReceita(receitaId: number): Promise<CustoReceita> {
  const itens = await listarIngredientesDaReceita(receitaId);
  const custoIngredientes = itens.reduce((total, i) => total + i.gramasUsadas * i.precoPorGrama, 0);
  const receita = await buscarReceita(receitaId);
  const rendimento = receita?.rendimento ?? 0;
  const precoPorUnidade = rendimento > 0 ? custoIngredientes / rendimento : 0;
  return { custoIngredientes, precoPorUnidade };
}
