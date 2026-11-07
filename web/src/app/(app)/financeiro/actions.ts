"use server";

import { revalidatePath } from "next/cache";
import * as financeiro from "@/lib/financeiro";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function fecharMesAction(formData: FormData) {
  const ano = Number(formData.get("ano"));
  const mes = Number(formData.get("mes"));
  if (!ano || !mes) return;

  const ultimoDia = new Date(ano, mes, 0).getDate();
  const inicio = `${ano}-${pad(mes)}-01`;
  const fim = `${ano}-${pad(mes)}-${pad(ultimoDia)}`;

  const resumo = await financeiro.resumoPeriodo(inicio, fim, undefined, true);
  const distribuicao = await financeiro.distribuicaoDinheiroRecebido(inicio, fim);
  const pendente = await financeiro.pendenteGeral();

  await financeiro.fecharMes(ano, mes, {
    ano,
    mes,
    faturamento: resumo.faturamento,
    custoProdutos: resumo.custoProdutos,
    lucroGerado: resumo.lucroGerado,
    recebido: distribuicao.recebido,
    pendente,
    reservaDespesas: distribuicao.reservaDespesas,
    reservaFinanceira: distribuicao.reservaFinanceira,
    funcionariaMae: distribuicao.funcionariaMae,
    proprietaria: distribuicao.proprietaria,
    taxaGasLuzAgua: resumo.custoOverhead,
  });

  revalidatePath("/financeiro");
}
