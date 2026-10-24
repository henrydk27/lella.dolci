import { notFound } from "next/navigation";
import * as embalagens from "@/lib/embalagens";
import { atualizarEmbalagem, removerEmbalagem } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function EditarEmbalagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const embalagem = await embalagens.buscarEmbalagem(Number(id));
  if (!embalagem) notFound();

  const salvar = atualizarEmbalagem.bind(null, embalagem.id);
  const remover = removerEmbalagem.bind(null, embalagem.id);

  return (
    <Cartao titulo="Editar embalagem" className="max-w-lg">
      <form action={salvar} className="space-y-4">
        <Campo rotulo="Nome" name="nome" defaultValue={embalagem.nome} required />
        <CampoSelect
          rotulo="Categoria"
          name="categoria"
          defaultValue={embalagem.categoria ?? ""}
          opcoes={[{ valor: "", texto: "-" }, ...embalagens.CATEGORIAS.map((c) => ({ valor: c, texto: c }))]}
        />
        <Campo rotulo="Custo total" name="custoTotal" type="number" step="any" defaultValue={embalagem.custoTotal} />
        <Campo rotulo="Rendimento" name="rendimento" type="number" defaultValue={embalagem.rendimento} />
        <Campo rotulo="Observações" name="observacoes" defaultValue={embalagem.observacoes ?? ""} />
        <p className="text-sm font-bold text-terracota-vibrante">
          Custo por unidade: R$ {embalagens.calcularCustoUnitario(embalagem).toFixed(2)}
        </p>
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
