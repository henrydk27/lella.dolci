import { eq, asc, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { produtos, produtoIngredientes, produtoEmbalagens, ingredientes, embalagens } from "@/db/schema";
import { calcularCustoUnitario } from "./embalagens";

export type Produto = typeof produtos.$inferSelect;

export const CATEGORIAS_SUGERIDAS = [
  "Geleia", "Brigadeiro", "Palha Italiana", "Alfajor", "Bombom Red Velvet",
  "Pao de Mel", "Biscoito", "Bombom", "Pudim", "Trufa", "Bem Casado",
  "Pastel de Nata", "Cones", "Canudinhos", "Biscoito Gengibre", "Ovinho",
  "Brigadeiro Personalizado", "Caixa",
];

export async function listarProdutos(): Promise<Produto[]> {
  return db.select().from(produtos).orderBy(asc(produtos.nome));
}

export async function buscarProduto(id: number): Promise<Produto | undefined> {
  const rows = await db.select().from(produtos).where(eq(produtos.id, id));
  return rows[0];
}

export async function listarCategorias(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ categoria: produtos.categoria })
    .from(produtos)
    .where(isNotNull(produtos.categoria));
  const existentes = rows.map((r) => r.categoria).filter((c): c is string => !!c && c.trim() !== "");
  const todas = [...existentes];
  for (const c of CATEGORIAS_SUGERIDAS) {
    if (!todas.includes(c)) todas.push(c);
  }
  return todas;
}

export async function adicionarProduto(dados: {
  nome: string;
  preco: number;
  descricao?: string | null;
  categoria?: string | null;
  taxaOverhead?: number;
}) {
  const [row] = await db
    .insert(produtos)
    .values({ taxaOverhead: 10, ...dados })
    .returning();
  return row;
}

export async function atualizarProduto(
  id: number,
  dados: { nome: string; preco: number; descricao?: string | null; categoria?: string | null; taxaOverhead: number }
) {
  await db.update(produtos).set(dados).where(eq(produtos.id, id));
}

export async function removerProduto(id: number) {
  await db.delete(produtos).where(eq(produtos.id, id));
}

// Usado pela venda de pronta entrega (desconta) e pelo planejador de
// producao (soma). delta negativo desconta, positivo acrescenta.
export async function ajustarEstoqueProduzido(produtoId: number, delta: number) {
  await db
    .update(produtos)
    .set({ estoqueProduzido: sql`${produtos.estoqueProduzido} + ${delta}` })
    .where(eq(produtos.id, produtoId));
}

export async function listarIngredientesDoProduto(produtoId: number) {
  return db
    .select({
      id: produtoIngredientes.id,
      nome: ingredientes.nome,
      unidade: ingredientes.unidade,
      quantidade: produtoIngredientes.quantidade,
      precoUnitario: ingredientes.precoUnitario,
    })
    .from(produtoIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId))
    .where(eq(produtoIngredientes.produtoId, produtoId));
}

export async function adicionarIngredienteAoProduto(produtoId: number, ingredienteId: number, quantidade: number) {
  await db.insert(produtoIngredientes).values({ produtoId, ingredienteId, quantidade });
}

export async function removerIngredienteDoProduto(relacaoId: number) {
  await db.delete(produtoIngredientes).where(eq(produtoIngredientes.id, relacaoId));
}

export async function listarEmbalagensDoProduto(produtoId: number) {
  return db
    .select({
      id: produtoEmbalagens.id,
      nome: embalagens.nome,
      custoTotal: embalagens.custoTotal,
      rendimento: embalagens.rendimento,
      quantidade: produtoEmbalagens.quantidade,
    })
    .from(produtoEmbalagens)
    .innerJoin(embalagens, eq(embalagens.id, produtoEmbalagens.embalagemId))
    .where(eq(produtoEmbalagens.produtoId, produtoId));
}

export async function adicionarEmbalagemAoProduto(produtoId: number, embalagemId: number, quantidade: number) {
  await db.insert(produtoEmbalagens).values({ produtoId, embalagemId, quantidade });
}

export async function removerEmbalagemDoProduto(relacaoId: number) {
  await db.delete(produtoEmbalagens).where(eq(produtoEmbalagens.id, relacaoId));
}

export async function calcularCustoIngredientes(produtoId: number): Promise<number> {
  const itens = await listarIngredientesDoProduto(produtoId);
  return itens.reduce((total, i) => total + i.quantidade * i.precoUnitario, 0);
}

export async function calcularCustoEmbalagens(produtoId: number): Promise<number> {
  const itens = await listarEmbalagensDoProduto(produtoId);
  return itens.reduce((total, e) => total + calcularCustoUnitario(e) * e.quantidade, 0);
}

export interface DetalheCusto {
  ingredientes: number;
  overhead: number;
  embalagens: number;
  total: number;
}

export async function detalharCustoProduto(produtoId: number): Promise<DetalheCusto> {
  const produto = await buscarProduto(produtoId);
  const custoIngredientes = await calcularCustoIngredientes(produtoId);
  const taxa = produto?.taxaOverhead ?? 10;
  const custoOverhead = custoIngredientes * (taxa / 100);
  const custoEmbalagens = await calcularCustoEmbalagens(produtoId);
  return {
    ingredientes: custoIngredientes,
    overhead: custoOverhead,
    embalagens: custoEmbalagens,
    total: custoIngredientes + custoOverhead + custoEmbalagens,
  };
}

export async function calcularMargemProduto(produtoId: number, precoVenda: number) {
  const detalhe = await detalharCustoProduto(produtoId);
  const margemReais = precoVenda - detalhe.total;
  const margemPercentual = precoVenda ? (margemReais / precoVenda) * 100 : 0;
  return { margemReais, margemPercentual, custoTotal: detalhe.total };
}
