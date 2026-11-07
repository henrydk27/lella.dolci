import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  pedidos,
  pedidoItens,
  produtos,
  produtoIngredientes,
  produtoEmbalagens,
  ingredientes,
  embalagens,
  clientes,
  pagamentos,
  fechamentosMensais,
} from "@/db/schema";
import * as pagamentosLib from "./pagamentos";

export const PERCENTUAL_RESERVA_DESPESAS = 0.1;
export const PERCENTUAL_RESERVA_FINANCEIRA = 0.08;
export const PERCENTUAL_FUNCIONARIA_MAE = 0.15;
export const PERCENTUAL_PROPRIETARIA = 0.77;

interface PedidoComItens {
  id: number;
  dataPedido: string;
  taxaEntrega: number;
  itens: { produtoId: number; quantidade: number; precoUnitario: number }[];
}

export function totalPedidoLocal(p: PedidoComItens): number {
  return p.itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0) + p.taxaEntrega;
}

async function anexarItens(linhasPedidos: { id: number; dataPedido: string; taxaEntrega: number }[]): Promise<PedidoComItens[]> {
  if (linhasPedidos.length === 0) return [];
  const ids = linhasPedidos.map((p) => p.id);
  const linhasItens = await db
    .select({
      pedidoId: pedidoItens.pedidoId,
      produtoId: pedidoItens.produtoId,
      quantidade: pedidoItens.quantidade,
      precoUnitario: pedidoItens.precoUnitario,
    })
    .from(pedidoItens)
    .where(inArray(pedidoItens.pedidoId, ids));

  const itensPorPedido = new Map<number, PedidoComItens["itens"]>();
  for (const item of linhasItens) {
    const lista = itensPorPedido.get(item.pedidoId) ?? [];
    lista.push(item);
    itensPorPedido.set(item.pedidoId, lista);
  }

  return linhasPedidos.map((p) => ({ ...p, itens: itensPorPedido.get(p.id) ?? [] }));
}

async function buscarPedidosComItensNoPeriodo(dataInicio: string, dataFim: string): Promise<PedidoComItens[]> {
  const linhasPedidos = await db
    .select({ id: pedidos.id, dataPedido: pedidos.dataPedido, taxaEntrega: pedidos.taxaEntrega })
    .from(pedidos)
    .where(and(gte(pedidos.dataPedido, dataInicio), lte(pedidos.dataPedido, dataFim + " 23:59:59")));
  return anexarItens(linhasPedidos);
}

async function buscarPedidosComItensPorIds(ids: number[]): Promise<PedidoComItens[]> {
  if (ids.length === 0) return [];
  const linhasPedidos = await db
    .select({ id: pedidos.id, dataPedido: pedidos.dataPedido, taxaEntrega: pedidos.taxaEntrega })
    .from(pedidos)
    .where(inArray(pedidos.id, ids));
  return anexarItens(linhasPedidos);
}

// Custo de ingredientes + embalagens de cada produto (sem a taxa de
// utilidades/overhead do produto - essa, no Financeiro, vira a "Reserva de
// despesas" calculada a parte, apenas sobre ingredientes).
//
// Duas consultas agregadas (uma para ingredientes, uma para embalagens),
// nunca uma por produto: com centenas de pedidos/produtos, uma consulta por
// produto para um banco remoto (Turso) facilmente estoura o tempo limite da
// funcao na Vercel - foi exatamente isso que travava o Dashboard/Financeiro
// em producao (rapido demais pra notar com o banco local).
async function mapaCustoPorProduto(produtoIds: number[]): Promise<Map<number, { ingredientes: number; total: number }>> {
  const unicos = Array.from(new Set(produtoIds));
  const mapa = new Map<number, { ingredientes: number; total: number }>();
  if (unicos.length === 0) return mapa;

  const linhasIngredientes = await db
    .select({
      produtoId: produtoIngredientes.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoIngredientes.quantidade} * ${ingredientes.precoUnitario}), 0)`,
    })
    .from(produtoIngredientes)
    .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId))
    .where(inArray(produtoIngredientes.produtoId, unicos))
    .groupBy(produtoIngredientes.produtoId);

  const linhasEmbalagens = await db
    .select({
      produtoId: produtoEmbalagens.produtoId,
      custo: sql<number>`COALESCE(SUM(${produtoEmbalagens.quantidade} * (${embalagens.custoTotal} * 1.0 / NULLIF(${embalagens.rendimento}, 0))), 0)`,
    })
    .from(produtoEmbalagens)
    .innerJoin(embalagens, eq(embalagens.id, produtoEmbalagens.embalagemId))
    .where(inArray(produtoEmbalagens.produtoId, unicos))
    .groupBy(produtoEmbalagens.produtoId);

  const mapaIngredientes = new Map(linhasIngredientes.map((l) => [l.produtoId, l.custo]));
  const mapaEmbalagens = new Map(linhasEmbalagens.map((l) => [l.produtoId, l.custo]));

  for (const id of unicos) {
    const ing = mapaIngredientes.get(id) ?? 0;
    const emb = mapaEmbalagens.get(id) ?? 0;
    mapa.set(id, { ingredientes: ing, total: ing + emb });
  }
  return mapa;
}

// Soma de pagamentos por pedido, numa unica consulta agregada - usado onde
// antes se chamava totalRecebidoPedido() num loop por pedido (o mesmo
// problema de uma consulta por item que lentidao em producao).
async function mapaRecebidoPorPedido(pedidoIds: number[]): Promise<Map<number, number>> {
  if (pedidoIds.length === 0) return new Map();
  const linhas = await db
    .select({
      pedidoId: pagamentos.pedidoId,
      total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)`,
    })
    .from(pagamentos)
    .where(inArray(pagamentos.pedidoId, pedidoIds))
    .groupBy(pagamentos.pedidoId);
  return new Map(linhas.map((l) => [l.pedidoId, l.total]));
}

export interface ResumoPeriodo {
  faturamento: number;
  custoIngredientes: number;
  custoProdutos: number;
  lucroGerado: number;
  quantidadePedidos: number;
}

// "Lucro gerado": resultado das vendas realizadas no periodo, descontando o
// custo de ingredientes + embalagens, independente de ja terem sido pagas.
export async function resumoPeriodo(dataInicio: string, dataFim: string, tipo?: string): Promise<ResumoPeriodo> {
  let pedidosPeriodo = await buscarPedidosComItensNoPeriodo(dataInicio, dataFim);
  if (tipo) {
    const idsDoTipo = new Set(
      (
        await db
          .select({ id: pedidos.id })
          .from(pedidos)
          .where(and(gte(pedidos.dataPedido, dataInicio), lte(pedidos.dataPedido, dataFim + " 23:59:59"), eq(pedidos.tipo, tipo)))
      ).map((p) => p.id)
    );
    pedidosPeriodo = pedidosPeriodo.filter((p) => idsDoTipo.has(p.id));
  }

  const produtoIds = pedidosPeriodo.flatMap((p) => p.itens.map((i) => i.produtoId));
  const custoMapa = await mapaCustoPorProduto(produtoIds);

  let faturamento = 0;
  let custoIngredientes = 0;
  let custoProdutos = 0;
  for (const p of pedidosPeriodo) {
    faturamento += totalPedidoLocal(p);
    for (const item of p.itens) {
      const custo = custoMapa.get(item.produtoId);
      custoIngredientes += (custo?.ingredientes ?? 0) * item.quantidade;
      custoProdutos += (custo?.total ?? 0) * item.quantidade;
    }
  }

  return {
    faturamento,
    custoIngredientes,
    custoProdutos,
    lucroGerado: faturamento - custoProdutos,
    quantidadePedidos: pedidosPeriodo.length,
  };
}

export interface DistribuicaoRecebida {
  recebido: number;
  lucroRecebido: number;
  custoIngredientesRecebido: number;
  reservaDespesas: number;
  lucroDisponivel: number;
  reservaFinanceira: number;
  funcionariaMae: number;
  proprietaria: number;
}

// Visao "dinheiro recebido": distribui proporcionalmente ao quanto de cada
// pedido ja foi efetivamente pago, usando a DATA DO PAGAMENTO (nao a data da
// venda) - um recebimento atrasado de uma venda antiga entra no mes em que
// o dinheiro realmente chegou.
export async function distribuicaoDinheiroRecebido(dataInicio: string, dataFim: string): Promise<DistribuicaoRecebida> {
  const pagamentosPeriodo = await pagamentosLib.listarPagamentosNoPeriodo(dataInicio, dataFim);
  const vazio: DistribuicaoRecebida = {
    recebido: 0,
    lucroRecebido: 0,
    custoIngredientesRecebido: 0,
    reservaDespesas: 0,
    lucroDisponivel: 0,
    reservaFinanceira: 0,
    funcionariaMae: 0,
    proprietaria: 0,
  };
  if (pagamentosPeriodo.length === 0) return vazio;

  const pedidoIds = Array.from(new Set(pagamentosPeriodo.map((p) => p.pedidoId)));
  const pedidosComItens = await buscarPedidosComItensPorIds(pedidoIds);
  const pedidosMapa = new Map(pedidosComItens.map((p) => [p.id, p]));
  const produtoIds = pedidosComItens.flatMap((p) => p.itens.map((i) => i.produtoId));
  const custoMapa = await mapaCustoPorProduto(produtoIds);

  let recebido = 0;
  let lucroRecebido = 0;
  let custoIngredientesRecebido = 0;

  for (const pagamento of pagamentosPeriodo) {
    const pedido = pedidosMapa.get(pagamento.pedidoId);
    if (!pedido) continue;
    const total = totalPedidoLocal(pedido);
    if (total <= 0) continue;
    const percentual = pagamento.valor / total;

    let custoIngredientesPedido = 0;
    let custoTotalPedido = 0;
    for (const item of pedido.itens) {
      const custo = custoMapa.get(item.produtoId);
      custoIngredientesPedido += (custo?.ingredientes ?? 0) * item.quantidade;
      custoTotalPedido += (custo?.total ?? 0) * item.quantidade;
    }

    recebido += pagamento.valor;
    lucroRecebido += percentual * (total - custoTotalPedido);
    custoIngredientesRecebido += percentual * custoIngredientesPedido;
  }

  const reservaDespesas = custoIngredientesRecebido * PERCENTUAL_RESERVA_DESPESAS;
  const lucroDisponivel = lucroRecebido - reservaDespesas;

  return {
    recebido,
    lucroRecebido,
    custoIngredientesRecebido,
    reservaDespesas,
    lucroDisponivel,
    reservaFinanceira: lucroDisponivel * PERCENTUAL_RESERVA_FINANCEIRA,
    funcionariaMae: lucroDisponivel * PERCENTUAL_FUNCIONARIA_MAE,
    proprietaria: lucroDisponivel * PERCENTUAL_PROPRIETARIA,
  };
}

// Saldo pendente de um pedido: total do pedido menos o que ja foi recebido.
export async function pendentePedido(pedidoId: number): Promise<number> {
  const pedidoRows = await buscarPedidosComItensPorIds([pedidoId]);
  const pedido = pedidoRows[0];
  if (!pedido) return 0;
  const total = totalPedidoLocal(pedido);
  const recebido = await pagamentosLib.totalRecebidoPedido(pedidoId);
  return total - recebido;
}

// Faturamento total (todas as vendas, qualquer data) menos o total ja
// recebido (qualquer data) = quanto ainda esta pendente de receber no total.
export async function pendenteGeral(): Promise<number> {
  const [itens] = await db
    .select({ total: sql<number>`COALESCE(SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario}), 0)` })
    .from(pedidoItens);
  const [{ taxaTotal }] = await db
    .select({ taxaTotal: sql<number>`COALESCE(SUM(${pedidos.taxaEntrega}), 0)` })
    .from(pedidos);
  const faturamentoGeral = (itens?.total ?? 0) + (taxaTotal ?? 0);
  const recebidoGeral = await pagamentosLib.totalRecebidoGeral();
  return faturamentoGeral - recebidoGeral;
}

// Quanto das vendas de um periodo especifico (pela data da venda) ainda nao
// foi recebido ate hoje - diferente de "recebido no periodo", que olha a
// data do PAGAMENTO em vez da data da venda.
export async function pendenteDoPeriodoDeVenda(dataInicio: string, dataFim: string): Promise<number> {
  const pedidosPeriodo = await buscarPedidosComItensNoPeriodo(dataInicio, dataFim);
  const recebidoMapa = await mapaRecebidoPorPedido(pedidosPeriodo.map((p) => p.id));
  let pendente = 0;
  for (const p of pedidosPeriodo) {
    pendente += totalPedidoLocal(p) - (recebidoMapa.get(p.id) ?? 0);
  }
  return pendente;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface ResumoAno {
  faturamento: number;
  custoProdutos: number;
  lucroGerado: number;
  recebido: number;
  custoIngredientesRecebido: number;
  lucroRecebido: number;
  reservaDespesas: number;
  lucroDisponivel: number;
  reservaFinanceira: number;
  funcionariaMae: number;
  proprietaria: number;
  pendenteDoAno: number;
}

// Mesma logica da pagina de um mes (fechamento congelado se existir, senao
// calculado na hora), somada para os 12 meses do ano - assim o card do ano
// bate exatamente com a soma do que cada mes mostraria se fosse aberto um
// por um.
export async function resumoAno(ano: number): Promise<ResumoAno> {
  const totais: ResumoAno = {
    faturamento: 0,
    custoProdutos: 0,
    lucroGerado: 0,
    recebido: 0,
    custoIngredientesRecebido: 0,
    lucroRecebido: 0,
    reservaDespesas: 0,
    lucroDisponivel: 0,
    reservaFinanceira: 0,
    funcionariaMae: 0,
    proprietaria: 0,
    pendenteDoAno: 0,
  };

  for (let mes = 1; mes <= 12; mes++) {
    const fechamento = await buscarFechamento(ano, mes);
    if (fechamento) {
      // O fechamento nao guarda custoIngredientesRecebido/lucroRecebido
      // separados, mas da pra reconstituir a partir do que foi congelado:
      // reservaDespesas = custoIngredientesRecebido * 10%, e lucroDisponivel
      // = lucroRecebido - reservaDespesas.
      const lucroDisponivel = fechamento.reservaFinanceira + fechamento.funcionariaMae + fechamento.proprietaria;
      const custoIngredientesRecebido = fechamento.reservaDespesas / PERCENTUAL_RESERVA_DESPESAS;
      totais.faturamento += fechamento.faturamento;
      totais.custoProdutos += fechamento.custoProdutos;
      totais.lucroGerado += fechamento.lucroGerado;
      totais.recebido += fechamento.recebido;
      totais.custoIngredientesRecebido += custoIngredientesRecebido;
      totais.lucroRecebido += lucroDisponivel + fechamento.reservaDespesas;
      totais.reservaDespesas += fechamento.reservaDespesas;
      totais.lucroDisponivel += lucroDisponivel;
      totais.reservaFinanceira += fechamento.reservaFinanceira;
      totais.funcionariaMae += fechamento.funcionariaMae;
      totais.proprietaria += fechamento.proprietaria;
      totais.pendenteDoAno += fechamento.pendente;
      continue;
    }

    const ultimoDia = new Date(ano, mes, 0).getDate();
    const inicio = `${ano}-${pad(mes)}-01`;
    const fim = `${ano}-${pad(mes)}-${pad(ultimoDia)}`;
    const [resumo, distrib, pendenteMes] = await Promise.all([
      resumoPeriodo(inicio, fim),
      distribuicaoDinheiroRecebido(inicio, fim),
      pendenteDoPeriodoDeVenda(inicio, fim),
    ]);
    totais.faturamento += resumo.faturamento;
    totais.custoProdutos += resumo.custoProdutos;
    totais.lucroGerado += resumo.lucroGerado;
    totais.recebido += distrib.recebido;
    totais.custoIngredientesRecebido += distrib.custoIngredientesRecebido;
    totais.lucroRecebido += distrib.lucroRecebido;
    totais.reservaDespesas += distrib.reservaDespesas;
    totais.lucroDisponivel += distrib.lucroDisponivel;
    totais.reservaFinanceira += distrib.reservaFinanceira;
    totais.funcionariaMae += distrib.funcionariaMae;
    totais.proprietaria += distrib.proprietaria;
    totais.pendenteDoAno += pendenteMes;
  }

  return totais;
}

// Pedidos com saldo ainda nao recebido, ordenados do mais antigo pro mais
// novo - para a lista de "Recebimentos atrasados" do Financeiro.
export async function pedidosComSaldoPendente() {
  const todos = await db
    .select({
      id: pedidos.id,
      clienteId: pedidos.clienteId,
      clienteNome: clientes.nome,
      dataPedido: pedidos.dataPedido,
      taxaEntrega: pedidos.taxaEntrega,
      status: pedidos.status,
    })
    .from(pedidos)
    .leftJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .orderBy(pedidos.dataPedido);

  const comItens = await anexarItens(todos);
  const recebidoMapa = await mapaRecebidoPorPedido(todos.map((t) => t.id));
  const porId = new Map(todos.map((t) => [t.id, t]));
  const resultado = [];
  for (const p of comItens) {
    const total = totalPedidoLocal(p);
    const recebido = recebidoMapa.get(p.id) ?? 0;
    const pendente = total - recebido;
    if (pendente > 0.009) {
      resultado.push({ ...porId.get(p.id)!, total, recebido, pendente });
    }
  }
  return resultado;
}

export interface Fechamento {
  ano: number;
  mes: number;
  faturamento: number;
  custoProdutos: number;
  lucroGerado: number;
  recebido: number;
  pendente: number;
  reservaDespesas: number;
  reservaFinanceira: number;
  funcionariaMae: number;
  proprietaria: number;
}

export async function buscarFechamento(ano: number, mes: number) {
  const [linha] = await db
    .select()
    .from(fechamentosMensais)
    .where(and(eq(fechamentosMensais.ano, ano), eq(fechamentosMensais.mes, mes)));
  return linha;
}

export async function fecharMes(ano: number, mes: number, dados: Fechamento) {
  const existente = await buscarFechamento(ano, mes);
  const agora = new Date().toISOString();
  if (existente) {
    await db
      .update(fechamentosMensais)
      .set({ ...dados, fechadoEm: agora })
      .where(eq(fechamentosMensais.id, existente.id));
  } else {
    await db.insert(fechamentosMensais).values({ ...dados, fechadoEm: agora });
  }
}

export interface LinhaPeriodo {
  pedidoId: number;
  dataPedido: string;
  tipo: string;
  status: string;
  produtoId: number;
  produtoNome: string;
  categoria: string;
  quantidade: number;
  precoUnitario: number;
}

// Linhas no nivel de item (pedido x produto) para alimentar o Dashboard:
// indicadores, graficos e filtros (categoria/situacao de pagamento) sao todos
// derivados dessa mesma lista, em memoria, pra nao multiplicar consultas.
export async function buscarLinhasPeriodo(dataInicio: string, dataFim: string): Promise<LinhaPeriodo[]> {
  return db
    .select({
      pedidoId: pedidos.id,
      dataPedido: pedidos.dataPedido,
      tipo: pedidos.tipo,
      status: pedidos.status,
      produtoId: produtos.id,
      produtoNome: produtos.nome,
      categoria: sql<string>`COALESCE(${produtos.categoria}, 'Sem categoria')`,
      quantidade: pedidoItens.quantidade,
      precoUnitario: pedidoItens.precoUnitario,
    })
    .from(pedidos)
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .where(and(gte(pedidos.dataPedido, dataInicio), lte(pedidos.dataPedido, dataFim + " 23:59:59")));
}

// Taxas de entrega sao por pedido (nao por item) - mapa separado para nao
// serem contadas mais de uma vez num pedido com varios itens.
export async function mapaTaxaEntregaPorPedido(dataInicio: string, dataFim: string): Promise<Map<number, number>> {
  const linhas = await db
    .select({ id: pedidos.id, taxaEntrega: pedidos.taxaEntrega })
    .from(pedidos)
    .where(and(gte(pedidos.dataPedido, dataInicio), lte(pedidos.dataPedido, dataFim + " 23:59:59")));
  return new Map(linhas.map((l) => [l.id, l.taxaEntrega]));
}

export async function mapaCustoIngredientesEmbalagens(produtoIds: number[]) {
  return mapaCustoPorProduto(produtoIds);
}

export async function listarFechamentos() {
  return db.select().from(fechamentosMensais).orderBy(sql`${fechamentosMensais.ano} DESC, ${fechamentosMensais.mes} DESC`);
}
