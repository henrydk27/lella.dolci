import { eq, and, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { planoProducaoItens, produtos, produtoIngredientes, ingredientes } from "@/db/schema";
import { ajustarEstoqueProduzido } from "./produtos";

export type ItemPlano = typeof planoProducaoItens.$inferSelect;

export interface IngredienteNecessario {
  nome: string;
  unidade: string;
  quantidadeNecessaria: number;
}

export interface ItemPlanoComDetalhe {
  id: number;
  data: string;
  produtoId: number;
  produtoNome: string;
  quantidadePlanejada: number;
  ordem: number;
  concluido: boolean;
  quantidadeProduzida: number | null;
  ingredientesNecessarios: IngredienteNecessario[];
}

export async function listarItensDoDia(data: string): Promise<ItemPlanoComDetalhe[]> {
  const itens = await db
    .select({
      id: planoProducaoItens.id,
      data: planoProducaoItens.data,
      produtoId: planoProducaoItens.produtoId,
      produtoNome: produtos.nome,
      quantidadePlanejada: planoProducaoItens.quantidadePlanejada,
      ordem: planoProducaoItens.ordem,
      concluido: planoProducaoItens.concluido,
      quantidadeProduzida: planoProducaoItens.quantidadeProduzida,
    })
    .from(planoProducaoItens)
    .innerJoin(produtos, eq(produtos.id, planoProducaoItens.produtoId))
    .where(eq(planoProducaoItens.data, data))
    .orderBy(asc(planoProducaoItens.ordem));

  const resultado: ItemPlanoComDetalhe[] = [];
  for (const item of itens) {
    const receita = await db
      .select({
        nome: ingredientes.nome,
        unidade: ingredientes.unidade,
        quantidadePorUnidade: produtoIngredientes.quantidade,
      })
      .from(produtoIngredientes)
      .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId))
      .where(eq(produtoIngredientes.produtoId, item.produtoId));

    resultado.push({
      ...item,
      ingredientesNecessarios: receita.map((r) => ({
        nome: r.nome,
        unidade: r.unidade,
        quantidadeNecessaria: r.quantidadePorUnidade * item.quantidadePlanejada,
      })),
    });
  }
  return resultado;
}

export async function adicionarItemPlano(data: string, produtoId: number, quantidadePlanejada: number) {
  const [{ maxOrdem }] = await db
    .select({ maxOrdem: sql<number>`COALESCE(MAX(${planoProducaoItens.ordem}), -1)` })
    .from(planoProducaoItens)
    .where(eq(planoProducaoItens.data, data));

  await db.insert(planoProducaoItens).values({
    data,
    produtoId,
    quantidadePlanejada,
    ordem: maxOrdem + 1,
  });
}

export async function removerItemPlano(itemId: number) {
  await db.delete(planoProducaoItens).where(eq(planoProducaoItens.id, itemId));
}

export async function marcarConcluido(itemId: number, quantidadeProduzida: number) {
  const [item] = await db.select().from(planoProducaoItens).where(eq(planoProducaoItens.id, itemId));
  if (!item) return;

  await db
    .update(planoProducaoItens)
    .set({ concluido: true, quantidadeProduzida })
    .where(eq(planoProducaoItens.id, itemId));

  // O que foi produzido entra no estoque de produto pronto.
  await ajustarEstoqueProduzido(item.produtoId, quantidadeProduzida);
}

export async function reabrirItem(itemId: number) {
  await db
    .update(planoProducaoItens)
    .set({ concluido: false })
    .where(eq(planoProducaoItens.id, itemId));
}

export async function moverItem(data: string, itemId: number, direcao: "cima" | "baixo") {
  const itens = await db
    .select({ id: planoProducaoItens.id, ordem: planoProducaoItens.ordem })
    .from(planoProducaoItens)
    .where(eq(planoProducaoItens.data, data))
    .orderBy(asc(planoProducaoItens.ordem));

  const indice = itens.findIndex((i) => i.id === itemId);
  if (indice === -1) return;
  const indiceVizinho = direcao === "cima" ? indice - 1 : indice + 1;
  if (indiceVizinho < 0 || indiceVizinho >= itens.length) return;

  const atual = itens[indice];
  const vizinho = itens[indiceVizinho];

  await db.update(planoProducaoItens).set({ ordem: vizinho.ordem }).where(eq(planoProducaoItens.id, atual.id));
  await db.update(planoProducaoItens).set({ ordem: atual.ordem }).where(eq(planoProducaoItens.id, vizinho.id));
}

export async function rendimentoPorProduto(dataInicio: string, dataFim: string) {
  return db
    .select({
      produtoId: planoProducaoItens.produtoId,
      produtoNome: produtos.nome,
      totalProduzido: sql<number>`SUM(${planoProducaoItens.quantidadeProduzida})`,
    })
    .from(planoProducaoItens)
    .innerJoin(produtos, eq(produtos.id, planoProducaoItens.produtoId))
    .where(
      and(
        eq(planoProducaoItens.concluido, true),
        sql`${planoProducaoItens.data} >= ${dataInicio}`,
        sql`${planoProducaoItens.data} <= ${dataFim}`
      )
    )
    .groupBy(planoProducaoItens.produtoId)
    .orderBy(sql`SUM(${planoProducaoItens.quantidadeProduzida}) DESC`);
}
