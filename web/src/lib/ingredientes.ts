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

export async function adicionarIngrediente(dados: {
  nome: string;
  unidade: string;
  quantidadeEstoque: number;
  precoUnitario: number;
}) {
  const [row] = await db.insert(ingredientes).values(dados).returning();
  return row;
}

export async function atualizarIngrediente(
  id: number,
  dados: { nome: string; unidade: string; quantidadeEstoque: number; precoUnitario: number }
) {
  await db.update(ingredientes).set(dados).where(eq(ingredientes.id, id));
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
