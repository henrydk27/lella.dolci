import { NextResponse } from "next/server";
import { sessaoAtual } from "@/lib/auth";
import { gerarPlanilhaBackup } from "@/lib/backup";

export async function GET() {
  // O proxy ja bloqueia rotas sem sessao, mas confere de novo aqui porque
  // essa rota entrega todos os dados do negocio de uma vez.
  const sessao = await sessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Nao autenticado." }, { status: 401 });
  }

  const buffer = await gerarPlanilhaBackup();
  const data = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lella-dolci-backup-${data}.xlsx"`,
    },
  });
}
