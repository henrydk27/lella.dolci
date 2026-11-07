"use server";

import { revalidatePath } from "next/cache";
import * as receitasLib from "@/lib/receitas";
import type { GrupoReceita } from "@/lib/receitas";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function criarReceita(formData: FormData) {
  const grupo = (String(formData.get("grupo") ?? "outros") as GrupoReceita) ?? "outros";
  const pesoUnidadeBruto = texto(formData, "pesoUnidadeGramas");
  await receitasLib.adicionarReceita({
    nome: String(formData.get("nome") ?? "").trim(),
    grupo,
    pesoUnidadeGramas: pesoUnidadeBruto ? Number(pesoUnidadeBruto) : null,
    rendimento: Number(formData.get("rendimento") ?? 1) || 1,
    observacoes: texto(formData, "observacoes"),
    taxaOverhead: Number(formData.get("taxaOverhead") ?? 10) || 0,
  });
  revalidatePath("/calculadora/receitas");
}

export async function atualizarReceita(id: number, formData: FormData) {
  const grupo = (String(formData.get("grupo") ?? "outros") as GrupoReceita) ?? "outros";
  const pesoUnidadeBruto = texto(formData, "pesoUnidadeGramas");
  await receitasLib.atualizarReceita(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    grupo,
    pesoUnidadeGramas: pesoUnidadeBruto ? Number(pesoUnidadeBruto) : null,
    rendimento: Number(formData.get("rendimento") ?? 1) || 1,
    observacoes: texto(formData, "observacoes"),
    taxaOverhead: Number(formData.get("taxaOverhead") ?? 10) || 0,
  });
  revalidatePath("/calculadora/receitas");
}

export async function removerReceita(id: number) {
  await receitasLib.removerReceita(id);
  revalidatePath("/calculadora/receitas");
}

export async function adicionarIngredienteReceita(receitaId: number, formData: FormData) {
  const ingredienteId = Number(formData.get("ingredienteId"));
  const gramas = Number(formData.get("gramasUsadas"));
  if (!ingredienteId || !gramas) return;
  await receitasLib.adicionarIngredienteNaReceita(receitaId, ingredienteId, gramas);
  revalidatePath("/calculadora/receitas");
}

export async function removerIngredienteReceita(relacaoId: number) {
  await receitasLib.removerIngredienteDaReceita(relacaoId);
  revalidatePath("/calculadora/receitas");
}
