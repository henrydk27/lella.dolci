import { eq, desc, asc, and, gte, lte, sql, ne } from "drizzle-orm";
import { db } from "@/db";
import { pedidos, pedidoItens, produtos, clientes, STATUS_PEDIDO, TIPOS_PEDIDO } from "@/db/schema";
import { ajustarEstoqueProduzido } from "./produtos";

export { STATUS_PEDIDO, TIPOS_PEDIDO };

export interface ItemPedidoEntrada {
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
}

function nowIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function criarPedido(
  clienteId: number | null,
  itens: ItemPedidoEntrada[],
  observacoes = "",
  dataEntrega: string | null = null,
  formaPagamento: string | null = null,
  tipo: string = "encomenda"
) {
  const [pedido] = await db
    .insert(pedidos)
    .values({
      clienteId,
      tipo,
      dataPedido: nowIso(),
      dataEntrega,
      formaPagamento,
      status: "pendente",
      observacoes,
    })
    .returning();

  for (const item of itens) {
    await db.insert(pedidoItens).values({
      pedidoId: pedido.id,
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    });
    // Pronta entrega vende do que ja esta pronto no estoque: o produto sai
    // da prateleira na hora, entao desconta ja na criacao do pedido.
    if (tipo === "pronta_entrega") {
      await ajustarEstoqueProduzido(item.produtoId, -item.quantidade);
    }
  }

  return pedido.id;
}

const selectPedidos = () =>
  db
    .select({
      id: pedidos.id,
      clienteId: pedidos.clienteId,
      clienteNome: clientes.nome,
      tipo: pedidos.tipo,
      dataPedido: pedidos.dataPedido,
      dataEntrega: pedidos.dataEntrega,
      formaPagamento: pedidos.formaPagamento,
      status: pedidos.status,
      observacoes: pedidos.observacoes,
    })
    .from(pedidos)
    .leftJoin(clientes, eq(clientes.id, pedidos.clienteId));

export async function listarPedidos() {
  return selectPedidos().orderBy(desc(pedidos.dataPedido));
}

export async function buscarPedido(id: number) {
  const [pedido] = await selectPedidos().where(eq(pedidos.id, id));
  if (!pedido) return { pedido: undefined, itens: [] };
  const itens = await db
    .select({
      id: pedidoItens.id,
      pedidoId: pedidoItens.pedidoId,
      produtoId: pedidoItens.produtoId,
      quantidade: pedidoItens.quantidade,
      precoUnitario: pedidoItens.precoUnitario,
      produtoNome: produtos.nome,
    })
    .from(pedidoItens)
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .where(eq(pedidoItens.pedidoId, id));
  return { pedido, itens };
}

export async function atualizarStatusPedido(id: number, status: string) {
  await db.update(pedidos).set({ status }).where(eq(pedidos.id, id));
}

export async function atualizarClientePedido(id: number, clienteId: number) {
  await db.update(pedidos).set({ clienteId }).where(eq(pedidos.id, id));
}

export async function atualizarTipoPedido(id: number, tipo: string) {
  await db.update(pedidos).set({ tipo }).where(eq(pedidos.id, id));
}

export async function atualizarDadosPedido(
  id: number,
  dataEntrega: string | null,
  formaPagamento: string | null,
  observacoes: string | null
) {
  await db.update(pedidos).set({ dataEntrega, formaPagamento, observacoes }).where(eq(pedidos.id, id));
}

export async function removerPedido(id: number) {
  await db.delete(pedidos).where(eq(pedidos.id, id));
}

export async function buscarItemPedido(itemId: number) {
  const [item] = await db.select().from(pedidoItens).where(eq(pedidoItens.id, itemId));
  return item;
}

export async function atualizarQuantidadeItem(itemId: number, quantidade: number) {
  await db.update(pedidoItens).set({ quantidade }).where(eq(pedidoItens.id, itemId));
}

export async function removerItemPedido(itemId: number) {
  await db.delete(pedidoItens).where(eq(pedidoItens.id, itemId));
}

export async function adicionarItemPedido(pedidoId: number, produtoId: number, quantidade: number, precoUnitario: number) {
  await db.insert(pedidoItens).values({ pedidoId, produtoId, quantidade, precoUnitario });
}

export async function totalPedido(id: number): Promise<number> {
  const { itens } = await buscarPedido(id);
  return itens.reduce((total, i) => total + i.quantidade * i.precoUnitario, 0);
}

export async function historicoVendas(dataInicio?: string, dataFim?: string, status?: string, tipo?: string) {
  const condicoes = [];
  if (dataInicio) condicoes.push(gte(pedidos.dataPedido, dataInicio));
  if (dataFim) condicoes.push(lte(pedidos.dataPedido, dataFim + " 23:59:59"));
  if (status) condicoes.push(eq(pedidos.status, status));
  if (tipo) condicoes.push(eq(pedidos.tipo, tipo));

  const query = selectPedidos();
  const withWhere = condicoes.length ? query.where(and(...condicoes)) : query;
  return withWhere.orderBy(desc(pedidos.dataPedido));
}

export async function resumoVendas(dataInicio?: string, dataFim?: string, tipo?: string) {
  const registros = await historicoVendas(dataInicio, dataFim, "pago", tipo);
  let total = 0;
  for (const p of registros) {
    total += await totalPedido(p.id);
  }
  return { quantidadePedidos: registros.length, totalVendas: total };
}

export async function resumoMesAtual() {
  const now = new Date();
  const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return resumoVendas(inicioMes);
}

export async function resumoPorTipo(dataInicio?: string, dataFim?: string) {
  const resultado: Record<string, { quantidadePedidos: number; totalVendas: number }> = {};
  for (const tipo of TIPOS_PEDIDO) {
    resultado[tipo] = await resumoVendas(dataInicio, dataFim, tipo);
  }
  return resultado;
}

export async function resumoPorTipoMesAtual() {
  const now = new Date();
  const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return resumoPorTipo(inicioMes);
}

export async function quantidadePedidosEmAberto(): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(ne(pedidos.status, "pago"));
  return total;
}

export async function produtoMaisVendido() {
  const [linha] = await db
    .select({ nome: produtos.nome, totalVendido: sql<number>`SUM(${pedidoItens.quantidade})`.as("total_vendido") })
    .from(pedidoItens)
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .where(eq(pedidos.status, "pago"))
    .groupBy(pedidoItens.produtoId)
    .orderBy(desc(sql`total_vendido`))
    .limit(1);
  return linha;
}

export async function encomendasFuturasPendentes() {
  const hoje = new Date().toISOString().slice(0, 10);
  const registros = await selectPedidos()
    .where(
      and(
        eq(pedidos.tipo, "encomenda"),
        ne(pedidos.status, "pago"),
        sql`${pedidos.dataEntrega} IS NOT NULL`,
        gte(pedidos.dataEntrega, hoje)
      )
    )
    .orderBy(asc(pedidos.dataEntrega));

  const resultado = [];
  for (const p of registros) {
    resultado.push({ ...p, total: await totalPedido(p.id) });
  }
  return resultado;
}

export async function vendasPorCategoria(ano?: string) {
  const condicoes = [eq(pedidos.status, "pago")];
  if (ano) condicoes.push(sql`substr(${pedidos.dataPedido}, 1, 4) = ${ano}`);

  return db
    .select({
      categoria: sql<string>`COALESCE(${produtos.categoria}, 'sem categoria')`.as("categoria"),
      total: sql<number>`SUM(${pedidoItens.quantidade})`,
    })
    .from(pedidoItens)
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .where(and(...condicoes))
    .groupBy(sql`categoria`)
    .orderBy(desc(sql`SUM(${pedidoItens.quantidade})`));
}
