import nodemailer from "nodemailer";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, pedidos, pedidoItens } from "@/db/schema";

export interface DevedorResumo {
  clienteId: number | null;
  clienteNome: string;
  quantidadePedidos: number;
  totalDevido: number;
}

// Soma, por cliente, tudo que ainda esta em aberto (qualquer pedido que nao
// esteja com status "pago"), somando itens + taxa de entrega.
// Usa agregacao SQL (nao um loop por pedido) para nao repetir o problema de
// N+1 ja visto nesse projeto.
export async function listarDevedores(): Promise<{ devedores: DevedorResumo[]; totalGeral: number }> {
  const itensPorCliente = await db
    .select({
      clienteId: pedidos.clienteId,
      clienteNome: clientes.nome,
      quantidadePedidos: sql<number>`COUNT(DISTINCT ${pedidos.id})`,
      itensTotal: sql<number>`COALESCE(SUM(${pedidoItens.quantidade} * ${pedidoItens.precoUnitario}), 0)`,
    })
    .from(pedidos)
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .leftJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(ne(pedidos.status, "pago"))
    .groupBy(pedidos.clienteId);

  const taxaPorCliente = await db
    .select({
      clienteId: pedidos.clienteId,
      taxaTotal: sql<number>`COALESCE(SUM(${pedidos.taxaEntrega}), 0)`,
    })
    .from(pedidos)
    .where(ne(pedidos.status, "pago"))
    .groupBy(pedidos.clienteId);

  const taxaPorClienteMapa = new Map<number | null, number>();
  for (const t of taxaPorCliente) {
    taxaPorClienteMapa.set(t.clienteId, t.taxaTotal);
  }

  const devedores: DevedorResumo[] = itensPorCliente
    .map((c) => ({
      clienteId: c.clienteId,
      clienteNome: c.clienteNome ?? "(sem cliente)",
      quantidadePedidos: c.quantidadePedidos,
      totalDevido: c.itensTotal + (taxaPorClienteMapa.get(c.clienteId) ?? 0),
    }))
    .sort((a, b) => b.totalDevido - a.totalDevido);

  const totalGeral = devedores.reduce((soma, d) => soma + d.totalDevido, 0);

  return { devedores, totalGeral };
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function montarHtmlResumo(devedores: DevedorResumo[], totalGeral: number): string {
  const linhas = devedores
    .map(
      (d) =>
        `<tr><td style="padding:4px 12px;border-bottom:1px solid #eee">${d.clienteNome}</td><td style="padding:4px 12px;border-bottom:1px solid #eee">${d.quantidadePedidos}</td><td style="padding:4px 12px;border-bottom:1px solid #eee">${formatarMoeda(d.totalDevido)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;color:#333">
      <h2 style="color:#b5651d">Lella Dolci — resumo de pedidos em aberto</h2>
      <p>${devedores.length === 0 ? "Nenhum pedido em aberto no momento." : "Segue quem ainda esta devendo:"}</p>
      ${
        devedores.length > 0
          ? `<table style="border-collapse:collapse;width:100%;max-width:480px">
              <thead><tr>
                <th style="text-align:left;padding:4px 12px;border-bottom:2px solid #b5651d">Cliente</th>
                <th style="text-align:left;padding:4px 12px;border-bottom:2px solid #b5651d">Pedidos</th>
                <th style="text-align:left;padding:4px 12px;border-bottom:2px solid #b5651d">Total devido</th>
              </tr></thead>
              <tbody>${linhas}</tbody>
            </table>
            <p style="margin-top:16px;font-weight:bold">Total em aberto: ${formatarMoeda(totalGeral)}</p>`
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

  const { devedores, totalGeral } = await listarDevedores();

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
