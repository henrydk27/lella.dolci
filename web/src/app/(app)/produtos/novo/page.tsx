import * as produtos from "@/lib/produtos";
import * as receitasLib from "@/lib/receitas";
import { criarProduto } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function NovoProdutoPage() {
  const categorias = await produtos.listarCategorias();
  const todasReceitas = await receitasLib.listarReceitas();

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
        <CampoSelect
          rotulo="Receita vinculada (opcional) — define o custo automaticamente"
          name="receitaId"
          opcoes={[
            { valor: "", texto: "Nenhuma (usar ingredientes/embalagens abaixo depois de criar)" },
            ...todasReceitas.map((r) => ({ valor: String(r.id), texto: r.nome })),
          ]}
        />
        <CampoArea rotulo="Descrição" name="descricao" rows={3} />
        <label className="flex items-center gap-2 text-sm text-texto">
          <input type="checkbox" name="disponivelNaCaixa" className="h-4 w-4 rounded border-borda" />
          Pode ser escolhido como sabor ao montar uma caixa (brigadeiro, beijinho, etc)
        </label>
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
