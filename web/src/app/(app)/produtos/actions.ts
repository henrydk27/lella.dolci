"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as produtos from "@/lib/produtos";

function numero(formData: FormData, campo: string, padrao = 0): number {
  const n = parseFloat(String(formData.get(campo) ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : padrao;
}

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function categoriaEscolhida(formData: FormData): string | null {
  // "Nova categoria" tem prioridade sobre a selecionada no menu suspenso.
  return texto(formData, "novaCategoria") ?? texto(formData, "categoria");
}

export async function criarProduto(formData: FormData) {
  await produtos.adicionarProduto({
    nome: String(formData.get("nome") ?? "").trim(),
    preco: numero(formData, "preco"),
    descricao: texto(formData, "descricao"),
    categoria: categoriaEscolhida(formData),
    taxaOverhead: numero(formData, "taxaOverhead", 10),
  });
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function atualizarProduto(id: number, formData: FormData) {
  await produtos.atualizarProduto(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    preco: numero(formData, "preco"),
    descricao: texto(formData, "descricao"),
    categoria: categoriaEscolhida(formData),
    taxaOverhead: numero(formData, "taxaOverhead", 10),
  });
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
}

export async function removerProduto(id: number) {
  await produtos.removerProduto(id);
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function adicionarIngredienteReceita(produtoId: number, formData: FormData) {
  const ingredienteId = Number(formData.get("ingredienteId"));
  const quantidade = numero(formData, "quantidade");
  if (ingredienteId) {
    await produtos.adicionarIngredienteAoProduto(produtoId, ingredienteId, quantidade);
  }
  revalidatePath(`/produtos/${produtoId}`);
}

export async function removerIngredienteReceita(produtoId: number, relacaoId: number) {
  await produtos.removerIngredienteDoProduto(relacaoId);
  revalidatePath(`/produtos/${produtoId}`);
}

export async function adicionarEmbalagemReceita(produtoId: number, formData: FormData) {
  const embalagemId = Number(formData.get("embalagemId"));
  const quantidade = numero(formData, "quantidade", 1);
  if (embalagemId) {
    await produtos.adicionarEmbalagemAoProduto(produtoId, embalagemId, quantidade);
  }
  revalidatePath(`/produtos/${produtoId}`);
}

export async function removerEmbalagemReceita(produtoId: number, relacaoId: number) {
  await produtos.removerEmbalagemDoProduto(relacaoId);
  revalidatePath(`/produtos/${produtoId}`);
}
