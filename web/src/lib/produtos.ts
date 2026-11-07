import { eq, asc, isNotNull, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  produtos,
  produtoIngredientes,
  produtoEmbalagens,
  ingredientes,
  embalagens,
  pedidoItens,
  receitas,
  receitaIngredientes,
} from "@/db/schema";
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
  disponivelNaCaixa?: boolean;
  receitaId?: number | null;
}) {
  const [row] = await db
    .insert(produtos)
    .values({ taxaOverhead: 10, ...dados })
    .returning();
  return row;
}

export async function atualizarProduto(
  id: number,
  dados: {
    nome: string;
    preco: number;
    descricao?: string | null;
    categoria?: string | null;
    taxaOverhead: number;
    disponivelNaCaixa: boolean;
    receitaId?: number | null;
  }
) {
  await db.update(produtos).set(dados).where(eq(produtos.id, id));
}

// Pedidos (passados ou atuais) guardam o produto vendido pra sempre, mesmo
// que o cadastro do produto mude ou seja removido depois - por isso essa
// ligacao nao tem exclusao em cascata. Antes de remover, avisamos se o
// produto tem pedidos, em vez de deixar o banco recusar com um erro cru.
export async function produtoTemPedidos(id: number): Promise<boolean> {
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(pedidoItens)
    .where(eq(pedidoItens.produtoId, id));
  return total > 0;
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

// Quando o produto tem uma receita vinculada, o custo de ingredientes e a
// taxa gas/luz/agua vem de la (ja dividido pelo rendimento da receita) em vez
// da lista direta de produtoIngredientes - assim, editar a receita atualiza o
// custo do produto automaticamente, sem precisar mexer em cada produto.
async function custoIngredientesEOverheadViaReceita(
  receitaId: number
): Promise<{ ingredientes: number; overhead: number } | null> {
  const [receita] = await db.select().from(receitas).where(eq(receitas.id, receitaId));
  if (!receita) return null;
  const [{ custo }] = await db
    .select({ custo: sql<number>`COALESCE(SUM(${receitaIngredientes.gramasUsadas} * ${ingredientes.precoUnitario}), 0)` })
    .from(receitaIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, receitaIngredientes.ingredienteId))
    .where(eq(receitaIngredientes.receitaId, receitaId));
  const rendimento = receita.rendimento || 1;
  const ingredientesPorUnidade = custo / rendimento;
  return { ingredientes: ingredientesPorUnidade, overhead: ingredientesPorUnidade * (receita.taxaOverhead / 100) };
}

export async function detalharCustoProduto(produtoId: number): Promise<DetalheCusto> {
  const produto = await buscarProduto(produtoId);
  const custoEmbalagens = await calcularCustoEmbalagens(produtoId);

  const viaReceita = produto?.receitaId ? await custoIngredientesEOverheadViaReceita(produto.receitaId) : null;
  if (viaReceita) {
    return {
      ingredientes: viaReceita.ingredientes,
      overhead: viaReceita.overhead,
      embalagens: custoEmbalagens,
      total: viaReceita.ingredientes + viaReceita.overhead + custoEmbalagens,
    };
  }

  const custoIngredientes = await calcularCustoIngredientes(produtoId);
  const taxa = produto?.taxaOverhead ?? 10;
  const custoOverhead = custoIngredientes * (taxa / 100);
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

export interface CustoResumoProduto {
  custoTotal: number;
  margemReais: number;
  margemPercentual: number;
}

export interface CustoIngredientesEEmbalagens {
  ingredientes: number;
  embalagens: number;
}

// Custo de ingredientes (via receita vinculada quando houver, senao a lista
// direta do produto) + embalagens, sem a taxa de gas/luz/agua - usado pelo
// Financeiro, que aplica sua propria reserva de despesas por cima. Separada
// de mapaCustoDeTodosProdutos porque so precisa de alguns produtos (os que
// aparecem num periodo), nao o catalogo inteiro.
export async function mapaCustoIngredientesEEmbalagens(
  produtoIds: number[]
): Promise<Map<number, CustoIngredientesEEmbalagens>> {
  const ids = Array.from(new Set(produtoIds));
  const mapa = new Map<number, CustoIngredientesEEmbalagens>();
  if (ids.length === 0) return mapa;

  const todos = await db.select().from(produtos).where(inArray(produtos.id, ids));
  const receitaIds = Array.from(new Set(todos.map((p) => p.receitaId).filter((id): id is number => id != null)));

  const linhasEmbalagens = await db
    .select({
      produtoId: produtoEmbalagens.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoEmbalagens.quantidade} * (${embalagens.custoTotal} * 1.0 / NULLIF(${embalagens.rendimento}, 0))), 0)`,
    })
    .from(produtoEmbalagens)
    .innerJoin(embalagens, eq(embalagens.id, produtoEmbalagens.embalagemId))
    .where(inArray(produtoEmbalagens.produtoId, ids))
    .groupBy(produtoEmbalagens.produtoId);
  const mapaEmbalagens = new Map(linhasEmbalagens.map((l) => [l.produtoId, l.custo]));

  const linhasIngredientesDiretos = await db
    .select({
      produtoId: produtoIngredientes.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoIngredientes.quantidade} * ${ingredientes.precoUnitario}), 0)`,
    })
    .from(produtoIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId))
    .where(inArray(produtoIngredientes.produtoId, ids))
    .groupBy(produtoIngredientes.produtoId);
  const mapaIngredientesDiretos = new Map(linhasIngredientesDiretos.map((l) => [l.produtoId, l.custo]));

  const mapaReceitaIngredientesPorUnidade = new Map<number, number>();
  if (receitaIds.length > 0) {
    const linhasReceitas = await db.select().from(receitas).where(inArray(receitas.id, receitaIds));
    const linhasReceitaIngredientes = await db
      .select({
        receitaId: receitaIngredientes.receitaId,
        custo: sql<number>`COALESCE(SUM(${receitaIngredientes.gramasUsadas} * ${ingredientes.precoUnitario}), 0)`,
      })
      .from(receitaIngredientes)
      .innerJoin(ingredientes, eq(ingredientes.id, receitaIngredientes.ingredienteId))
      .where(inArray(receitaIngredientes.receitaId, receitaIds))
      .groupBy(receitaIngredientes.receitaId);
    const mapaReceitaCustoIngredientes = new Map(linhasReceitaIngredientes.map((l) => [l.receitaId, l.custo]));
    for (const r of linhasReceitas) {
      const custoTotal = mapaReceitaCustoIngredientes.get(r.id) ?? 0;
      mapaReceitaIngredientesPorUnidade.set(r.id, custoTotal / (r.rendimento || 1));
    }
  }

  for (const p of todos) {
    const ingredientesCusto = p.receitaId
      ? mapaReceitaIngredientesPorUnidade.get(p.receitaId) ?? 0
      : mapaIngredientesDiretos.get(p.id) ?? 0;
    mapa.set(p.id, { ingredientes: ingredientesCusto, embalagens: mapaEmbalagens.get(p.id) ?? 0 });
  }
  return mapa;
}

// Versao em lote de detalharCustoProduto + calcularMargemProduto, usada na
// listagem de produtos - faz um punhado de consultas agregadas em vez de uma
// consulta por produto (uma consulta por produto contra o Turso remoto fica
// lento conforme o catalogo cresce).
export async function mapaCustoDeTodosProdutos(): Promise<Map<number, CustoResumoProduto>> {
  const todos = await listarProdutos();
  if (todos.length === 0) return new Map();
  const ids = todos.map((p) => p.id);
  const receitaIds = Array.from(new Set(todos.map((p) => p.receitaId).filter((id): id is number => id != null)));

  const linhasEmbalagens = await db
    .select({
      produtoId: produtoEmbalagens.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoEmbalagens.quantidade} * (${embalagens.custoTotal} * 1.0 / NULLIF(${embalagens.rendimento}, 0))), 0)`,
    })
    .from(produtoEmbalagens)
    .innerJoin(embalagens, eq(embalagens.id, produtoEmbalagens.embalagemId))
    .where(inArray(produtoEmbalagens.produtoId, ids))
    .groupBy(produtoEmbalagens.produtoId);
  const mapaEmbalagens = new Map(linhasEmbalagens.map((l) => [l.produtoId, l.custo]));

  const linhasIngredientesDiretos = await db
    .select({
      produtoId: produtoIngredientes.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoIngredientes.quantidade} * ${ingredientes.precoUnitario}), 0)`,
    })
    .from(produtoIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId))
    .where(inArray(produtoIngredientes.produtoId, ids))
    .groupBy(produtoIngredientes.produtoId);
  const mapaIngredientesDiretos = new Map(linhasIngredientesDiretos.map((l) => [l.produtoId, l.custo]));

  const mapaReceitas = new Map<number, { rendimento: number; taxaOverhead: number; custoIngredientes: number }>();
  if (receitaIds.length > 0) {
    const linhasReceitas = await db.select().from(receitas).where(inArray(receitas.id, receitaIds));
    const linhasReceitaIngredientes = await db
      .select({
        receitaId: receitaIngredientes.receitaId,
        custo: sql<number>`COALESCE(SUM(${receitaIngredientes.gramasUsadas} * ${ingredientes.precoUnitario}), 0)`,
      })
      .from(receitaIngredientes)
      .innerJoin(ingredientes, eq(ingredientes.id, receitaIngredientes.ingredienteId))
      .where(inArray(receitaIngredientes.receitaId, receitaIds))
      .groupBy(receitaIngredientes.receitaId);
    const mapaReceitaCustoIngredientes = new Map(linhasReceitaIngredientes.map((l) => [l.receitaId, l.custo]));
    for (const r of linhasReceitas) {
      mapaReceitas.set(r.id, {
        rendimento: r.rendimento || 1,
        taxaOverhead: r.taxaOverhead,
        custoIngredientes: mapaReceitaCustoIngredientes.get(r.id) ?? 0,
      });
    }
  }

  const resultado = new Map<number, CustoResumoProduto>();
  for (const p of todos) {
    const embalagem = mapaEmbalagens.get(p.id) ?? 0;
    let custoIngredientes: number;
    let custoOverhead: number;
    const receita = p.receitaId ? mapaReceitas.get(p.receitaId) : undefined;
    if (receita) {
      custoIngredientes = receita.custoIngredientes / receita.rendimento;
      custoOverhead = custoIngredientes * (receita.taxaOverhead / 100);
    } else {
      custoIngredientes = mapaIngredientesDiretos.get(p.id) ?? 0;
      custoOverhead = custoIngredientes * (p.taxaOverhead / 100);
    }
    const custoTotal = custoIngredientes + custoOverhead + embalagem;
    const margemReais = p.preco - custoTotal;
    const margemPercentual = p.preco ? (margemReais / p.preco) * 100 : 0;
    resultado.set(p.id, { custoTotal, margemReais, margemPercentual });
  }
  return resultado;
}
