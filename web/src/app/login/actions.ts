"use server";

import { redirect } from "next/navigation";
import { credenciaisValidas, criarSessao } from "@/lib/auth";

export async function entrar(_prevState: { erro: string } | undefined, formData: FormData) {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!usuario || !senha) {
    return { erro: "Informe usuario e senha." };
  }

  if (!credenciaisValidas(usuario, senha)) {
    return { erro: "Usuario ou senha invalidos." };
  }

  await criarSessao(usuario);
  redirect("/");
}
