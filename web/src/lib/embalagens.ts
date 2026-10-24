import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { embalagens } from "@/db/schema";

export type Embalagem = typeof embalagens.$inferSelect;

export async function listarEmbalagens(): Promise<Embalagem[]> {
  return db.select().from(embalagens).orderBy(asc(embalagens.nome));
}

export async function buscarEmbalagem(id: number): Promise<Embalagem | undefined> {
  const rows = await db.select().from(embalagens).where(eq(embalagens.id, id));
  return rows[0];
}

interface DadosEmbalagem {
  nome: string;
  custoTotal: number;
  rendimento: number;
  categoria?: string | null;
  observacoes?: string | null;
}

export async function adicionarEmbalagem(dados: DadosEmbalagem) {
  const [row] = await db.insert(embalagens).values(dados).returning();
  return row;
}

export async function atualizarEmbalagem(id: number, dados: DadosEmbalagem) {
  await db.update(embalagens).set(dados).where(eq(embalagens.id, id));
}

export async function removerEmbalagem(id: number) {
  await db.delete(embalagens).where(eq(embalagens.id, id));
}

export function calcularCustoUnitario(embalagem: Pick<Embalagem, "custoTotal" | "rendimento">): number {
  if (!embalagem.rendimento) return 0;
  return embalagem.custoTotal / embalagem.rendimento;
}
