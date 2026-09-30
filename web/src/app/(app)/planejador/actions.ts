"use server";

import { revalidatePath } from "next/cache";
import * as planejador from "@/lib/planejador";

export async function adicionarItem(data: string, formData: FormData) {
  const produtoId = Number(formData.get("produtoId"));
  const quantidade = Number(formData.get("quantidadePlanejada"));
  if (produtoId && quantidade > 0) {
    await planejador.adicionarItemPlano(data, produtoId, quantidade);
  }
  revalidatePath("/planejador");
}

export async function removerItem(data: string, itemId: number) {
  await planejador.removerItemPlano(itemId);
  revalidatePath("/planejador");
}

export async function concluirItem(data: string, itemId: number, formData: FormData) {
  const quantidadeProduzida = Number(formData.get("quantidadeProduzida"));
  if (quantidadeProduzida >= 0) {
    await planejador.marcarConcluido(itemId, quantidadeProduzida);
  }
  revalidatePath("/planejador");
  revalidatePath("/produtos");
}

export async function reabrirItem(data: string, itemId: number) {
  await planejador.reabrirItem(itemId);
  revalidatePath("/planejador");
}

export async function moverItem(data: string, itemId: number, direcao: "cima" | "baixo") {
  await planejador.moverItem(data, itemId, direcao);
  revalidatePath("/planejador");
}
