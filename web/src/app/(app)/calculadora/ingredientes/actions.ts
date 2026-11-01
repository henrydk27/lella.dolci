"use server";

import { revalidatePath } from "next/cache";
import * as ingredientesLib from "@/lib/ingredientes";

function numero(formData: FormData, campo: string): number {
  const valor = String(formData.get(campo) ?? "").replace(",", ".");
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

export async function atualizarIngredientesNaCalculadora(formData: FormData) {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);

  const atualizacoes = ids.map((id) => ({
    id,
    unidade: String(formData.get(`unidade-${id}`) ?? "g"),
    gramasPorEmbalagem: numero(formData, `gramasPorEmbalagem-${id}`),
    precoEmbalagem: numero(formData, `precoEmbalagem-${id}`),
  }));

  await ingredientesLib.atualizarVariosIngredientes(atualizacoes);
  revalidatePath("/calculadora/ingredientes");
  revalidatePath("/ingredientes");
}
