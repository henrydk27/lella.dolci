import { notFound } from "next/navigation";
import * as gastos from "@/lib/gastos";
import { atualizarGasto, removerGasto } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function EditarGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gasto = await gastos.buscarGasto(Number(id));
  if (!gasto) notFound();

  const salvar = atualizarGasto.bind(null, gasto.id);
  const remover = removerGasto.bind(null, gasto.id);

  return (
    <Cartao titulo="Editar gasto" className="max-w-lg">
      <form action={salvar} className="space-y-4">
        <Campo rotulo="Nome" name="nome" defaultValue={gasto.nome} required />
        <Campo rotulo="Data" name="data" type="date" defaultValue={gasto.data} required />
        <CampoSelect
          rotulo="Forma de pagamento"
          name="tipoPagamento"
          defaultValue={gasto.tipoPagamento ?? ""}
          opcoes={[{ valor: "", texto: "-" }, ...gastos.TIPOS_PAGAMENTO.map((t) => ({ valor: t, texto: t }))]}
        />
        <CampoSelect
          rotulo="Categoria"
          name="categoria"
          defaultValue={gasto.categoria ?? ""}
          opcoes={[{ valor: "", texto: "-" }, ...gastos.CATEGORIAS.map((c) => ({ valor: c, texto: c }))]}
        />
        <Campo rotulo="Valor" name="valor" type="number" step="any" defaultValue={gasto.valor} required />
        <Botao type="submit">Salvar</Botao>
      </form>
      <form action={remover} className="mt-3">
        <Botao type="submit" perigo>
          Remover
        </Botao>
      </form>
    </Cartao>
  );
}
