import * as produtos from "@/lib/produtos";
import { criarProduto } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function NovoProdutoPage() {
  const categorias = await produtos.listarCategorias();

  return (
    <Cartao titulo="Novo produto" className="max-w-lg">
      <form action={criarProduto} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Bolo de chocolate" required />
        <CampoSelect
          rotulo="Categoria"
          name="categoria"
          opcoes={[{ valor: "", texto: "-" }, ...categorias.map((c) => ({ valor: c, texto: c }))]}
        />
        <Campo
          rotulo="Nova categoria (preencha só se precisar de uma categoria que não está na lista acima)"
          name="novaCategoria"
          placeholder="Opcional"
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Preço de venda" name="preco" type="number" step="any" required />
          <Campo rotulo="Taxa utilidades (%)" name="taxaOverhead" type="number" step="any" defaultValue={10} />
        </div>
        <CampoArea rotulo="Descrição" name="descricao" rows={3} />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
