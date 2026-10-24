"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { credenciaisValidas, criarSessao } from "@/lib/auth";
import { verificarBloqueio, registrarTentativaFalha, registrarTentativaSucesso } from "@/lib/loginSeguranca";

async function ipDoCliente(): Promise<string> {
  const store = await headers();
  const encaminhado = store.get("x-forwarded-for");
  return encaminhado?.split(",")[0].trim() || "desconhecido";
}

export async function entrar(_prevState: { erro: string } | undefined, formData: FormData) {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const ip = await ipDoCliente();

  const { bloqueado, minutosRestantes } = await verificarBloqueio(ip);
  if (bloqueado) {
    return { erro: `Muitas tentativas. Tente novamente em ${minutosRestantes} minuto(s).` };
  }

  if (!usuario || !senha) {
    return { erro: "Informe usuario e senha." };
  }

  if (!credenciaisValidas(usuario, senha)) {
    await registrarTentativaFalha(ip);
    return { erro: "Usuario ou senha invalidos." };
  }

  await registrarTentativaSucesso(ip);
  await criarSessao(usuario);
  redirect("/");
}
