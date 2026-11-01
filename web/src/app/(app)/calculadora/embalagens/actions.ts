"use server";

import { revalidatePath } from "next/cache";
import * as embalagensLib from "@/lib/embalagens";

function numero(formData: FormData, campo: string): number {
  const valor = String(formData.get(campo) ?? "").replace(",", ".");
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

export async function atualizarEmbalagensNaCalculadora(formData: FormData) {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);

  const atualizacoes = ids.map((id) => ({
    id,
    categoria: String(formData.get(`categoria-${id}`) ?? "").trim() || null,
    custoTotal: numero(formData, `custoTotal-${id}`),
    rendimento: Math.max(1, Math.round(numero(formData, `rendimento-${id}`)) || 1),
  }));

  await embalagensLib.atualizarVariasEmbalagens(atualizacoes);
  revalidatePath("/calculadora/embalagens");
  revalidatePath("/embalagens");
}
