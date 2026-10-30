import { NextRequest, NextResponse } from "next/server";
import { enviarAlertaDevedores } from "@/lib/alertas";

export async function GET(request: NextRequest) {
  // A Vercel adiciona esse header automaticamente nas chamadas de cron quando
  // a variavel CRON_SECRET esta configurada no projeto. Sem isso, qualquer
  // pessoa poderia disparar o envio de e-mail so acessando a URL.
  const segredoEsperado = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (segredoEsperado && autorizacao !== `Bearer ${segredoEsperado}`) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  try {
    const resultado = await enviarAlertaDevedores();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("Falha ao enviar alerta de devedores:", erro);
    return NextResponse.json({ ok: false, erro: String(erro) }, { status: 500 });
  }
}
