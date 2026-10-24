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
  const [agregado] = await db
    .select({
      quantidadePedidos: sql<number>`COUNT(DISTINCT ${pedidos.id})`,
      totalGasto: sql<number>`COALESCE(SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario}), 0)`,
      ultimaCompra: sql<string | null>`MAX(${pedidos.dataPedido})`,
    })
    .from(pedidos)
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .where(and(eq(pedidos.clienteId, clienteId), eq(pedidos.status, "pago")));

  const quantidadePedidos = agregado?.quantidadePedidos ?? 0;
  const totalGasto = agregado?.totalGasto ?? 0;
  const ultimaCompra = agregado?.ultimaCompra ?? null;
  const ticketMedio = quantidadePedidos ? totalGasto / quantidadePedidos : 0;

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

interface EstatisticasBasicas {
  totalGasto: number;
  quantidadePedidos: number;
  ultimaCompra: string | null;
}

async function estatisticasBasicasTodosClientes(): Promise<Map<number, EstatisticasBasicas>> {
  const linhas = await db
    .select({
      clienteId: pedidos.clienteId,
      quantidadePedidos: sql<number>`COUNT(DISTINCT ${pedidos.id})`,
      totalGasto: sql<number>`COALESCE(SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario}), 0)`,
      ultimaCompra: sql<string | null>`MAX(${pedidos.dataPedido})`,
    })
    .from(pedidos)
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .where(eq(pedidos.status, "pago"))
    .groupBy(pedidos.clienteId);

  const mapa = new Map<number, EstatisticasBasicas>();
  for (const l of linhas) {
    if (l.clienteId == null) continue;
    mapa.set(l.clienteId, {
      totalGasto: l.totalGasto,
      quantidadePedidos: l.quantidadePedidos,
      ultimaCompra: l.ultimaCompra,
    });
  }
  return mapa;
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
  const estatisticasPorCliente = await estatisticasBasicasTodosClientes();
  return todos.map((cliente) => {
    const basicas = estatisticasPorCliente.get(cliente.id) ?? {
      totalGasto: 0,
      quantidadePedidos: 0,
      ultimaCompra: null,
    };
    const estatisticas: EstatisticasCliente = { ...basicas, ticketMedio: 0, produtoFavorito: null };
    estatisticas.ticketMedio = estatisticas.quantidadePedidos ? estatisticas.totalGasto / estatisticas.quantidadePedidos : 0;
    return { cliente, ...estatisticas, status: calcularStatus(estatisticas) };
  });
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
  const estatisticasPorCliente = await estatisticasBasicasTodosClientes();
  const resultado = [];
  for (const cliente of todos) {
    const basicas = estatisticasPorCliente.get(cliente.id);
    if (!basicas || basicas.quantidadePedidos === 0 || !basicas.ultimaCompra) continue;
    const diasSemCompra = Math.floor(
      (Date.now() - new Date(basicas.ultimaCompra.slice(0, 10)).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasSemCompra > dias) {
      const estatisticas: EstatisticasCliente = {
        ...basicas,
        ticketMedio: basicas.totalGasto / basicas.quantidadePedidos,
        produtoFavorito: null,
      };
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
