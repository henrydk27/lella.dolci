"use server";

import { revalidatePath } from "next/cache";
import * as ingredientesLib from "@/lib/ingredientes";

function numero(formData: FormData, campo: string): number {
  const valor = String(formData.get(campo) ?? "").replace(",", ".");
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

export async function atualizarIngredienteNaCalculadora(id: number, formData: FormData) {
  const atual = await ingredientesLib.buscarIngrediente(id);
  if (!atual) return;
  await ingredientesLib.atualizarIngrediente(id, {
    nome: atual.nome,
    quantidadeEstoque: atual.quantidadeEstoque,
    unidade: String(formData.get("unidade") ?? "g"),
    gramasPorEmbalagem: numero(formData, "gramasPorEmbalagem"),
    precoEmbalagem: numero(formData, "precoEmbalagem"),
  });
  revalidatePath("/calculadora/ingredientes");
  revalidatePath("/ingredientes");
}
