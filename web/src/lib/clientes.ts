import { eq, sql, and, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { clientes, pedidos, pedidoItens, produtos } from "@/db/schema";

export type Cliente = typeof clientes.$inferSelect;

export const DIAS_INATIVIDADE = 60;
export const LIMITE_VIP = 300;

export type StatusCliente = "novo" | "recorrente" | "vip" | "inativo";

export interface EstatisticasCliente {
  totalGasto: number;
  quantidadePedidos: number;
  ticketMedio: number;
  ultimaCompra: string | null;
  produtoFavorito: string | null;
}

export async function listarClientes(): Promise<Cliente[]> {
  return db.select().from(clientes).orderBy(asc(clientes.nome));
}

export async function buscarCliente(id: number): Promise<Cliente | undefined> {
  const rows = await db.select().from(clientes).where(eq(clientes.id, id));
  return rows[0];
}

export async function adicionarCliente(dados: {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  aniversario?: string | null;
  comoConheceu?: string | null;
  notas?: string | null;
}) {
  const [row] = await db.insert(clientes).values(dados).returning();
  return row;
}

export async function atualizarCliente(
  id: number,
  dados: {
    nome: string;
    telefone?: string | null;
    email?: string | null;
    endereco?: string | null;
    aniversario?: string | null;
    comoConheceu?: string | null;
    notas?: string | null;
  }
) {
  await db.update(clientes).set(dados).where(eq(clientes.id, id));
}

export async function removerCliente(id: number) {
  await db.delete(clientes).where(eq(clientes.id, id));
}

async function estatisticasCliente(clienteId: number): Promise<EstatisticasCliente> {
  const pedidosPagos = await db
    .select({ id: pedidos.id, dataPedido: pedidos.dataPedido })
    .from(pedidos)
    .where(and(eq(pedidos.clienteId, clienteId), eq(pedidos.status, "pago")));

  let totalGasto = 0;
  for (const p of pedidosPagos) {
    const [{ subtotal }] = await db
      .select({ subtotal: sql<number>`COALESCE(SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario}), 0)` })
      .from(pedidoItens)
      .where(eq(pedidoItens.pedidoId, p.id));
    totalGasto += subtotal;
  }

  const quantidadePedidos = pedidosPagos.length;
  const ticketMedio = quantidadePedidos ? totalGasto / quantidadePedidos : 0;
  const ultimaCompra = pedidosPagos.length
    ? pedidosPagos.reduce((max, p) => (p.dataPedido > max ? p.dataPedido : max), pedidosPagos[0].dataPedido)
    : null;

  const [favorito] = await db
    .select({ nome: produtos.nome, total: sql<number>`SUM(${pedidoItens.quantidade})`.as("total") })
    .from(pedidoItens)
    .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .where(and(eq(pedidos.clienteId, clienteId), eq(pedidos.status, "pago")))
    .groupBy(pedidoItens.produtoId)
    .orderBy(desc(sql`total`))
    .limit(1);

  return {
    totalGasto,
    quantidadePedidos,
    ticketMedio,
    ultimaCompra,
    produtoFavorito: favorito?.nome ?? null,
  };
}

export function calcularStatus(estatisticas: EstatisticasCliente): StatusCliente {
  if (estatisticas.quantidadePedidos === 0) return "novo";
  if (estatisticas.totalGasto >= LIMITE_VIP) return "vip";
  if (estatisticas.ultimaCompra) {
    const dias = Math.floor(
      (Date.now() - new Date(estatisticas.ultimaCompra.slice(0, 10)).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dias > DIAS_INATIVIDADE) return "inativo";
  }
  return "recorrente";
}

export async function perfilCliente(clienteId: number) {
  const cliente = await buscarCliente(clienteId);
  if (!cliente) return null;
  const estatisticas = await estatisticasCliente(clienteId);
  return { cliente, ...estatisticas, status: calcularStatus(estatisticas) };
}

export async function historicoPedidosCliente(clienteId: number) {
  return db
    .select()
    .from(pedidos)
    .where(eq(pedidos.clienteId, clienteId))
    .orderBy(desc(pedidos.dataPedido));
}

export async function listarClientesComStatus() {
  const todos = await listarClientes();
  const resultado = [];
  for (const cliente of todos) {
    const estatisticas = await estatisticasCliente(cliente.id);
    resultado.push({ cliente, ...estatisticas, status: calcularStatus(estatisticas) });
  }
  return resultado;
}

export async function buscarOuCriarClientePorNome(nomeBruto: string): Promise<number> {
  const nome = nomeBruto.trim();
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(sql`LOWER(TRIM(${clientes.nome})) = ${nome.toLowerCase()}`);
  if (existente) return existente.id;
  const [novo] = await db.insert(clientes).values({ nome }).returning();
  return novo.id;
}

export async function aniversariantesDoMes(): Promise<Cliente[]> {
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
  const todos = await db
    .select()
    .from(clientes)
    .where(sql`${clientes.aniversario} IS NOT NULL AND TRIM(${clientes.aniversario}) <> ''`);

  return todos.filter((c) => {
    const partes = (c.aniversario ?? "").replace(/\//g, "-").split("-");
    let mes: string | undefined;
    if (partes.length === 3) mes = partes[1];
    else if (partes.length === 2) mes = partes[0].length <= 2 && partes[1].length <= 2 ? partes[1] : partes[0];
    return mes && mes.padStart(2, "0") === mesAtual;
  });
}

export async function clientesInativos(dias = DIAS_INATIVIDADE) {
  const todos = await listarClientes();
  const resultado = [];
  for (const cliente of todos) {
    const estatisticas = await estatisticasCliente(cliente.id);
    if (estatisticas.quantidadePedidos === 0 || !estatisticas.ultimaCompra) continue;
    const diasSemCompra = Math.floor(
      (Date.now() - new Date(estatisticas.ultimaCompra.slice(0, 10)).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasSemCompra > dias) {
      resultado.push({ cliente, diasSemCompra, ...estatisticas });
    }
  }
  resultado.sort((a, b) => b.diasSemCompra - a.diasSemCompra);
  return resultado;
}

export async function clienteMaiorGasto(dataInicio?: string, dataFim?: string) {
  const condicoes = [eq(pedidos.status, "pago")];
  if (dataInicio) condicoes.push(gte(pedidos.dataPedido, dataInicio));
  if (dataFim) condicoes.push(lte(pedidos.dataPedido, dataFim + " 23:59:59"));

  const [linha] = await db
    .select({
      id: clientes.id,
      nome: clientes.nome,
      totalGasto: sql<number>`SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario})`.as("total_gasto"),
    })
    .from(pedidos)
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(and(...condicoes))
    .groupBy(pedidos.clienteId)
    .orderBy(desc(sql`total_gasto`))
    .limit(1);

  return linha;
}
