import nodemailer from "nodemailer";
import { eq, ne, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, pedidos, pedidoItens, produtos, pagamentos } from "@/db/schema";

export interface ItemDevido {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface PedidoDevido {
  pedidoId: number;
  dataPedido: string;
  itens: ItemDevido[];
  pendente: number;
}

export interface DevedorDetalhado {
  clienteId: number | null;
  clienteNome: string;
  pedidos: PedidoDevido[];
  totalDevido: number;
}

// Para cada pedido ainda nao marcado como "pago", calcula o saldo realmente
// pendente (total do pedido menos o que ja foi efetivamente recebido via
// pagamentos - cobre pagamentos parciais corretamente) e agrupa por cliente,
// com o detalhe de cada pedido (data + itens). Tudo em poucas consultas em
// lote, sem uma consulta por pedido.
export async function listarDevedoresDetalhado(): Promise<{ devedores: DevedorDetalhado[]; totalGeral: number }> {
  const pedidosAbertos = await db
    .select({
      id: pedidos.id,
      clienteId: pedidos.clienteId,
      clienteNome: clientes.nome,
      dataPedido: pedidos.dataPedido,
      taxaEntrega: pedidos.taxaEntrega,
    })
    .from(pedidos)
    .leftJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(ne(pedidos.status, "pago"));

  if (pedidosAbertos.length === 0) return { devedores: [], totalGeral: 0 };

  const ids = pedidosAbertos.map((p) => p.id);

  const itensLinhas = await db
    .select({
      pedidoId: pedidoItens.pedidoId,
      produtoNome: produtos.nome,
      quantidade: pedidoItens.quantidade,
      precoUnitario: pedidoItens.precoUnitario,
    })
    .from(pedidoItens)
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId))
    .where(inArray(pedidoItens.pedidoId, ids));

  const pagamentosLinhas = await db
    .select({
      pedidoId: pagamentos.pedidoId,
      total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)`,
    })
    .from(pagamentos)
    .where(inArray(pagamentos.pedidoId, ids))
    .groupBy(pagamentos.pedidoId);

  const itensPorPedido = new Map<number, ItemDevido[]>();
  for (const i of itensLinhas) {
    const lista = itensPorPedido.get(i.pedidoId) ?? [];
    lista.push({ produtoNome: i.produtoNome, quantidade: i.quantidade, precoUnitario: i.precoUnitario });
    itensPorPedido.set(i.pedidoId, lista);
  }
  const recebidoPorPedido = new Map(pagamentosLinhas.map((p) => [p.pedidoId, p.total]));

  const porCliente = new Map<string, DevedorDetalhado>();

  for (const p of pedidosAbertos) {
    const itens = itensPorPedido.get(p.id) ?? [];
    const totalItens = itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);
    const total = totalItens + p.taxaEntrega;
    const recebido = recebidoPorPedido.get(p.id) ?? 0;
    const pendente = total - recebido;
    if (pendente <= 0.009) continue;

    const chave = p.clienteNome ?? `__sem_cliente_${p.id}`;
    let devedor = porCliente.get(chave);
    if (!devedor) {
      devedor = { clienteId: p.clienteId, clienteNome: p.clienteNome ?? "(sem cliente)", pedidos: [], totalDevido: 0 };
      porCliente.set(chave, devedor);
    }
    devedor.pedidos.push({ pedidoId: p.id, dataPedido: p.dataPedido, itens, pendente });
    devedor.totalDevido += pendente;
  }

  const devedores = Array.from(porCliente.values()).sort((a, b) => b.totalDevido - a.totalDevido);
  for (const d of devedores) {
    d.pedidos.sort((a, b) => a.dataPedido.localeCompare(b.dataPedido));
  }

  const totalGeral = devedores.reduce((soma, d) => soma + d.totalDevido, 0);
  return { devedores, totalGeral };
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBr(dataPedido: string): string {
  const [ano, mes, dia] = dataPedido.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

function formatarItens(itens: ItemDevido[]): string {
  return itens.map((i) => `${i.quantidade}x ${i.produtoNome}`).join(", ");
}

function montarHtmlResumo(devedores: DevedorDetalhado[], totalGeral: number): string {
  const blocosClientes = devedores
    .map((d) => {
      const linhasPedidos = d.pedidos
        .map(
          (p) =>
            `<li style="padding:2px 0">${dataBr(p.dataPedido)} - ${formatarItens(p.itens)} - ${formatarMoeda(p.pendente)}</li>`
        )
        .join("");
      return `
        <div style="margin-bottom:16px">
          <p style="margin:0 0 4px;font-weight:bold">${d.clienteNome} — ${formatarMoeda(d.totalDevido)}</p>
          <ul style="margin:0;padding-left:18px">${linhasPedidos}</ul>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family:sans-serif;color:#333">
      <h2 style="color:#b5651d">Lella Dolci — pedidos em aberto</h2>
      <p>${devedores.length === 0 ? "Nenhum pedido em aberto no momento." : "Segue quem ainda esta devendo, pedido por pedido:"}</p>
      ${
        devedores.length > 0
          ? `${blocosClientes}<p style="margin-top:16px;font-weight:bold">Total em aberto: ${formatarMoeda(totalGeral)}</p>`
          : ""
      }
    </div>
  `;
}

export async function enviarAlertaDevedores() {
  const usuario = process.env.GMAIL_USER;
  const senhaApp = process.env.GMAIL_APP_PASSWORD;
  const destinatario = process.env.ALERTA_EMAIL_PARA || usuario;

  if (!usuario || !senhaApp) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD nao configurados.");
  }

  const { devedores, totalGeral } = await listarDevedoresDetalhado();

  const transportador = nodemailer.createTransport({
    service: "gmail",
    auth: { user: usuario, pass: senhaApp },
  });

  const hoje = new Date().toLocaleDateString("pt-BR");
  await transportador.sendMail({
    from: `"Lella Dolci" <${usuario}>`,
    to: destinatario,
    subject: `Lella Dolci — pedidos em aberto (${hoje})`,
    html: montarHtmlResumo(devedores, totalGeral),
  });

  return { enviados: devedores.length, totalGeral };
}
