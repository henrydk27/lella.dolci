"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as ingredientes from "@/lib/ingredientes";

function numero(formData: FormData, campo: string): number {
  const valor = String(formData.get(campo) ?? "").replace(",", ".");
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

export async function criarIngrediente(formData: FormData) {
  await ingredientes.adicionarIngrediente({
    nome: String(formData.get("nome") ?? "").trim(),
    unidade: String(formData.get("unidade") ?? "").trim(),
    quantidadeEstoque: numero(formData, "quantidadeEstoque"),
    precoUnitario: numero(formData, "precoUnitario"),
  });
  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}

export async function atualizarIngrediente(id: number, formData: FormData) {
  await ingredientes.atualizarIngrediente(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    unidade: String(formData.get("unidade") ?? "").trim(),
    quantidadeEstoque: numero(formData, "quantidadeEstoque"),
    precoUnitario: numero(formData, "precoUnitario"),
  });
  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}

export async function removerIngrediente(id: number) {
  await ingredientes.removerIngrediente(id);
  revalidatePath("/ingredientes");
  redirect("/ingredientes");
}

export async function ajustarEstoqueIngrediente(id: number, formData: FormData) {
  const delta = numero(formData, "delta");
  await ingredientes.ajustarEstoque(id, delta);
  revalidatePath("/ingredientes");
  revalidatePath(`/ingredientes/${id}`);
}
