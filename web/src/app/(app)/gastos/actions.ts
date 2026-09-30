"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as gastos from "@/lib/gastos";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function numero(formData: FormData, campo: string): number {
  const n = parseFloat(String(formData.get(campo) ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function criarGasto(formData: FormData) {
  await gastos.adicionarGasto({
    nome: String(formData.get("nome") ?? "").trim(),
    data: String(formData.get("data") ?? ""),
    tipoPagamento: texto(formData, "tipoPagamento"),
    categoria: texto(formData, "categoria"),
    valor: numero(formData, "valor"),
  });
  revalidatePath("/gastos");
  redirect("/gastos");
}

export async function atualizarGasto(id: number, formData: FormData) {
  await gastos.atualizarGasto(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    data: String(formData.get("data") ?? ""),
    tipoPagamento: texto(formData, "tipoPagamento"),
    categoria: texto(formData, "categoria"),
    valor: numero(formData, "valor"),
  });
  revalidatePath("/gastos");
  redirect("/gastos");
}

export async function removerGasto(id: number) {
  await gastos.removerGasto(id);
  revalidatePath("/gastos");
  redirect("/gastos");
}
