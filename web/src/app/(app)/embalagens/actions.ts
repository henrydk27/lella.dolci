"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as embalagens from "@/lib/embalagens";

function numero(formData: FormData, campo: string): number {
  const n = parseFloat(String(formData.get(campo) ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function inteiro(formData: FormData, campo: string): number {
  const n = parseInt(String(formData.get(campo) ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function criarEmbalagem(formData: FormData) {
  await embalagens.adicionarEmbalagem({
    nome: String(formData.get("nome") ?? "").trim(),
    categoria: texto(formData, "categoria"),
    custoTotal: numero(formData, "custoTotal"),
    rendimento: inteiro(formData, "rendimento"),
    observacoes: texto(formData, "observacoes"),
  });
  revalidatePath("/embalagens");
  redirect("/embalagens");
}

export async function atualizarEmbalagem(id: number, formData: FormData) {
  await embalagens.atualizarEmbalagem(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    categoria: texto(formData, "categoria"),
    custoTotal: numero(formData, "custoTotal"),
    rendimento: inteiro(formData, "rendimento"),
    observacoes: texto(formData, "observacoes"),
  });
  revalidatePath("/embalagens");
  redirect("/embalagens");
}

export async function removerEmbalagem(id: number) {
  await embalagens.removerEmbalagem(id);
  revalidatePath("/embalagens");
  redirect("/embalagens");
}
