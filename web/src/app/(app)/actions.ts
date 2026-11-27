"use server";

import { enviarAlertaDevedores } from "@/lib/alertas";

export async function enviarAlertaDevedoresAction() {
  try {
    const { enviados, totalGeral } = await enviarAlertaDevedores();
    return { ok: true as const, enviados, totalGeral };
  } catch (erro) {
    return { ok: false as const, erro: String(erro) };
  }
}
