import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { ingredientes } from "@/db/schema";

export type Ingrediente = typeof ingredientes.$inferSelect;

export async function listarIngredientes(): Promise<Ingrediente[]> {
  return db.select().from(ingredientes).orderBy(asc(ingredientes.nome));
}

export async function buscarIngrediente(id: number): Promise<Ingrediente | undefined> {
  const rows = await db.select().from(ingredientes).where(eq(ingredientes.id, id));
  return rows[0];
}

export function calcularPrecoPorGrama(gramasPorEmbalagem: number, precoEmbalagem: number): number {
  if (!gramasPorEmbalagem) return 0;
  return precoEmbalagem / gramasPorEmbalagem;
}

interface DadosIngrediente {
  nome: string;
  quantidadeEstoque: number;
  gramasPorEmbalagem: number;
  precoEmbalagem: number;
  unidade?: string;
}

export async function adicionarIngrediente(dados: DadosIngrediente) {
  const [row] = await db
    .insert(ingredientes)
    .values({
      nome: dados.nome,
      unidade: dados.unidade ?? "g",
      quantidadeEstoque: dados.quantidadeEstoque,
      gramasPorEmbalagem: dados.gramasPorEmbalagem,
      precoEmbalagem: dados.precoEmbalagem,
      precoUnitario: calcularPrecoPorGrama(dados.gramasPorEmbalagem, dados.precoEmbalagem),
    })
    .returning();
  return row;
}

export async function atualizarIngrediente(id: number, dados: DadosIngrediente) {
  await db
    .update(ingredientes)
    .set({
      nome: dados.nome,
      unidade: dados.unidade ?? "g",
      quantidadeEstoque: dados.quantidadeEstoque,
      gramasPorEmbalagem: dados.gramasPorEmbalagem,
      precoEmbalagem: dados.precoEmbalagem,
      precoUnitario: calcularPrecoPorGrama(dados.gramasPorEmbalagem, dados.precoEmbalagem),
    })
    .where(eq(ingredientes.id, id));
}

interface AtualizacaoIngrediente {
  id: number;
  unidade: string;
  gramasPorEmbalagem: number;
  precoEmbalagem: number;
}

export async function atualizarVariosIngredientes(atualizacoes: AtualizacaoIngrediente[]) {
  for (const a of atualizacoes) {
    await db
      .update(ingredientes)
      .set({
        unidade: a.unidade,
        gramasPorEmbalagem: a.gramasPorEmbalagem,
        precoEmbalagem: a.precoEmbalagem,
        precoUnitario: calcularPrecoPorGrama(a.gramasPorEmbalagem, a.precoEmbalagem),
      })
      .where(eq(ingredientes.id, a.id));
  }
}

export async function removerIngrediente(id: number) {
  await db.delete(ingredientes).where(eq(ingredientes.id, id));
}

export async function ajustarEstoque(id: number, delta: number) {
  const ing = await buscarIngrediente(id);
  if (!ing) return;
  await db
    .update(ingredientes)
    .set({ quantidadeEstoque: ing.quantidadeEstoque + delta })
    .where(eq(ingredientes.id, id));
}
