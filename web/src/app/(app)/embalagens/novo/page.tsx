import { criarEmbalagem } from "../actions";
import * as embalagens from "@/lib/embalagens";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovaEmbalagemPage() {
  return (
    <Cartao titulo="Nova embalagem" className="max-w-lg">
      <form action={criarEmbalagem} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Caixa 6 doces" required />
        <CampoSelect
          rotulo="Categoria"
          name="categoria"
          opcoes={[{ valor: "", texto: "-" }, ...embalagens.CATEGORIAS.map((c) => ({ valor: c, texto: c }))]}
        />
        <Campo rotulo="Custo total (do rolo/pacote/lote)" name="custoTotal" type="number" step="any" defaultValue={0} />
        <Campo rotulo="Rendimento (quantas unidades saem)" name="rendimento" type="number" defaultValue={1} />
        <Campo rotulo="Observações" name="observacoes" placeholder="Ex: dimensões, fornecedor" />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
