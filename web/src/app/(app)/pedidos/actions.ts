"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as pedidos from "@/lib/pedidos";
import * as clientes from "@/lib/clientes";
import * as produtos from "@/lib/produtos";
import * as pagamentosLib from "@/lib/pagamentos";
import { buscarOpcaoCaixa, precoPorUnidadeDaCaixa } from "@/lib/caixas";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function criarPedido(formData: FormData) {
  const nomeCliente = String(formData.get("cliente") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "encomenda");
  if (!nomeCliente && tipo !== "pronta_entrega") throw new Error("Informe o cliente.");

  const itensBrutos = JSON.parse(String(formData.get("itensJson") ?? "[]")) as {
    produtoId: number;
    quantidade: number;
    daCaixa?: boolean;
    caixaValor?: string;
  }[];
  if (itensBrutos.length === 0) throw new Error("Adicione ao menos um item ao pedido.");

  // O preco de cada item vem do cadastro atual do produto, nunca do cliente,
  // para nao permitir que um pedido seja criado com um preco fabricado. Um
  // item vindo de uma caixa fechada e' excecao: usa o preco rateado da caixa
  // (tambem recalculado aqui a partir do nome da caixa, nunca confiando no
  // valor que o navegador mandou), que e' menor que o preco avulso do sabor.
  const itens = [];
  for (const item of itensBrutos) {
    const produto = await produtos.buscarProduto(item.produtoId);
    if (!produto) continue;
    const opcaoCaixaValida = item.daCaixa && item.caixaValor ? buscarOpcaoCaixa(item.caixaValor) : undefined;
    const precoUnitario = opcaoCaixaValida ? precoPorUnidadeDaCaixa(opcaoCaixaValida.valor) : produto.preco;
    itens.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario });
  }
  if (itens.length === 0) throw new Error("Nenhum item valido informado.");

  const clienteId = nomeCliente ? await clientes.buscarOuCriarClientePorNome(nomeCliente) : null;
  const pedidoId = await pedidos.criarPedido({
    clienteId,
    itens,
    observacoes: String(formData.get("observacoes") ?? "").trim(),
    dataEntrega: texto(formData, "dataEntrega"),
    formaPagamento: texto(formData, "formaPagamento"),
    tipo,
    caixa: texto(formData, "caixa"),
    taxaEntrega: parseFloat(String(formData.get("taxaEntrega") ?? "0").replace(",", ".")) || 0,
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${pedidoId}`);
}

export async function atualizarDadosPedido(id: number, formData: FormData) {
  const nomeCliente = String(formData.get("cliente") ?? "").trim();
  if (nomeCliente) {
    const clienteId = await clientes.buscarOuCriarClientePorNome(nomeCliente);
    await pedidos.atualizarClientePedido(id, clienteId);
  }

  await pedidos.atualizarDadosPedido(
    id,
    texto(formData, "dataEntrega"),
    texto(formData, "formaPagamento"),
    String(formData.get("observacoes") ?? "").trim(),
    texto(formData, "caixa"),
    parseFloat(String(formData.get("taxaEntrega") ?? "0").replace(",", ".")) || 0
  );

  const status = String(formData.get("status") ?? "");
  if (status) await pedidos.atualizarStatusPedido(id, status);

  const tipo = String(formData.get("tipo") ?? "");
  if (tipo) await pedidos.atualizarTipoPedido(id, tipo);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
  redirect("/pedidos");
}

export async function removerPedido(id: number) {
  const { pedido, itens } = await pedidos.buscarPedido(id);
  if (pedido?.tipo === "pronta_entrega") {
    for (const item of itens) {
      await produtos.ajustarEstoqueProduzido(item.produtoId, item.quantidade);
    }
  }
  await pedidos.removerPedido(id);
  revalidatePath("/pedidos");
  revalidatePath("/produtos");
  redirect("/pedidos");
}

export async function adicionarItemPedido(pedidoId: number, formData: FormData) {
  const produtoId = Number(formData.get("produtoId"));
  const quantidade = Number(formData.get("quantidade"));
  const produto = await produtos.buscarProduto(produtoId);
  if (produto && quantidade > 0) {
    await pedidos.adicionarItemPedido(pedidoId, produtoId, quantidade, produto.preco);

    const { pedido } = await pedidos.buscarPedido(pedidoId);
    if (pedido?.tipo === "pronta_entrega") {
      await produtos.ajustarEstoqueProduzido(produtoId, -quantidade);
    }
  }
  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/produtos");
}

export async function atualizarQuantidadeItem(pedidoId: number, itemId: number, formData: FormData) {
  const quantidade = Number(formData.get("quantidade"));
  if (quantidade > 0) {
    const itemAtual = await pedidos.buscarItemPedido(itemId);
    await pedidos.atualizarQuantidadeItem(itemId, quantidade);

    if (itemAtual) {
      const { pedido } = await pedidos.buscarPedido(pedidoId);
      if (pedido?.tipo === "pronta_entrega") {
        // So a diferenca entra/sai do estoque, nao a quantidade inteira de novo.
        const diferenca = itemAtual.quantidade - quantidade;
        await produtos.ajustarEstoqueProduzido(itemAtual.produtoId, diferenca);
      }
    }
  }
  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/produtos");
}

export async function registrarPagamento(pedidoId: number, formData: FormData) {
  const valor = parseFloat(String(formData.get("valor") ?? "0").replace(",", "."));
  const data = String(formData.get("data") ?? "").trim();
  if (valor > 0 && data) {
    await pagamentosLib.adicionarPagamento(pedidoId, valor, data, texto(formData, "observacoes"));
  }
  revalidatePath(`/pedidos/${pedidoId}`);
}

export async function removerPagamento(pedidoId: number, pagamentoId: number) {
  await pagamentosLib.removerPagamento(pagamentoId);
  revalidatePath(`/pedidos/${pedidoId}`);
}

export async function removerItemPedido(pedidoId: number, itemId: number) {
  const itemAtual = await pedidos.buscarItemPedido(itemId);
  await pedidos.removerItemPedido(itemId);

  if (itemAtual) {
    const { pedido } = await pedidos.buscarPedido(pedidoId);
    if (pedido?.tipo === "pronta_entrega") {
      // Item removido do pedido volta pro estoque pronto.
      await produtos.ajustarEstoqueProduzido(itemAtual.produtoId, itemAtual.quantidade);
    }
  }
  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/produtos");
}
