import * as produtos from "@/lib/produtos";
import { criarProduto } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function NovoProdutoPage() {
  const categorias = await produtos.listarCategorias();

  return (
    <Cartao titulo="Novo produto" className="max-w-lg">
      <form action={criarProduto} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Bolo de chocolate" required />
        <Campo rotulo="Categoria" name="categoria" list="categorias" placeholder="Escolha ou digite uma nova" />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
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
