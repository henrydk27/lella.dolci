"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as pedidos from "@/lib/pedidos";
import * as clientes from "@/lib/clientes";
import * as produtos from "@/lib/produtos";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function criarPedido(formData: FormData) {
  const nomeCliente = String(formData.get("cliente") ?? "").trim();
  if (!nomeCliente) throw new Error("Informe o cliente.");

  const itensBrutos = JSON.parse(String(formData.get("itensJson") ?? "[]")) as {
    produtoId: number;
    quantidade: number;
  }[];
  if (itensBrutos.length === 0) throw new Error("Adicione ao menos um item ao pedido.");

  // O preco de cada item vem do cadastro atual do produto, nunca do cliente,
  // para nao permitir que um pedido seja criado com um preco fabricado.
  const itens = [];
  for (const item of itensBrutos) {
    const produto = await produtos.buscarProduto(item.produtoId);
    if (!produto) continue;
    itens.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario: produto.preco });
  }
  if (itens.length === 0) throw new Error("Nenhum item valido informado.");

  const clienteId = await clientes.buscarOuCriarClientePorNome(nomeCliente);
  const tipo = String(formData.get("tipo") ?? "encomenda");
  const pedidoId = await pedidos.criarPedido(
    clienteId,
    itens,
    String(formData.get("observacoes") ?? "").trim(),
    texto(formData, "dataEntrega"),
    texto(formData, "formaPagamento"),
    tipo
  );

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
    String(formData.get("observacoes") ?? "").trim()
  );

  const status = String(formData.get("status") ?? "");
  if (status) await pedidos.atualizarStatusPedido(id, status);

  const tipo = String(formData.get("tipo") ?? "");
  if (tipo) await pedidos.atualizarTipoPedido(id, tipo);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
}

export async function removerPedido(id: number) {
  await pedidos.removerPedido(id);
  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function adicionarItemPedido(pedidoId: number, formData: FormData) {
  const produtoId = Number(formData.get("produtoId"));
  const quantidade = Number(formData.get("quantidade"));
  const produto = await produtos.buscarProduto(produtoId);
  if (produto && quantidade > 0) {
    await pedidos.adicionarItemPedido(pedidoId, produtoId, quantidade, produto.preco);
  }
  revalidatePath(`/pedidos/${pedidoId}`);
}

export async function atualizarQuantidadeItem(pedidoId: number, itemId: number, formData: FormData) {
  const quantidade = Number(formData.get("quantidade"));
  if (quantidade > 0) {
    await pedidos.atualizarQuantidadeItem(itemId, quantidade);
  }
  revalidatePath(`/pedidos/${pedidoId}`);
}

export async function removerItemPedido(pedidoId: number, itemId: number) {
  await pedidos.removerItemPedido(itemId);
  revalidatePath(`/pedidos/${pedidoId}`);
}
