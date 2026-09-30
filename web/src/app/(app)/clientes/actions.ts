"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as clientes from "@/lib/clientes";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function dadosCliente(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    telefone: texto(formData, "telefone"),
    email: texto(formData, "email"),
    endereco: texto(formData, "endereco"),
    aniversario: texto(formData, "aniversario"),
    comoConheceu: texto(formData, "comoConheceu"),
    notas: texto(formData, "notas"),
  };
}

export async function criarCliente(formData: FormData) {
  await clientes.adicionarCliente(dadosCliente(formData));
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function atualizarCliente(id: number, formData: FormData) {
  await clientes.atualizarCliente(id, dadosCliente(formData));
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect("/clientes");
}

export async function removerCliente(id: number) {
  await clientes.removerCliente(id);
  revalidatePath("/clientes");
  redirect("/clientes");
}
