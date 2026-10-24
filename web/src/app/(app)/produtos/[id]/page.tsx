import { notFound } from "next/navigation";
import * as produtos from "@/lib/produtos";
import * as ingredientesLib from "@/lib/ingredientes";
import * as embalagensLib from "@/lib/embalagens";
import {
  atualizarProduto,
  removerProduto,
  adicionarIngredienteReceita,
  removerIngredienteReceita,
  adicionarEmbalagemReceita,
  removerEmbalagemReceita,
} from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produtoId = Number(id);
  const produto = await produtos.buscarProduto(produtoId);
  if (!produto) notFound();

  const categorias = await produtos.listarCategorias();
  const ingredientesReceita = await produtos.listarIngredientesDoProduto(produtoId);
  const embalagensReceita = await produtos.listarEmbalagensDoProduto(produtoId);
  const detalhe = await produtos.detalharCustoProduto(produtoId);
  const margem = await produtos.calcularMargemProduto(produtoId, produto.preco);

  const todosIngredientes = await ingredientesLib.listarIngredientes();
  const todasEmbalagens = await embalagensLib.listarEmbalagens();

  const salvar = atualizarProduto.bind(null, produtoId);
  const remover = removerProduto.bind(null, produtoId);
  const addIngrediente = adicionarIngredienteReceita.bind(null, produtoId);
  const addEmbalagem = adicionarEmbalagemReceita.bind(null, produtoId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Cartao titulo="Dados do produto">
        <form action={salvar} className="space-y-4">
          <Campo rotulo="Nome" name="nome" defaultValue={produto.nome} required />
          <CampoSelect
            rotulo="Categoria"
            name="categoria"
            defaultValue={produto.categoria ?? ""}
            opcoes={[{ valor: "", texto: "-" }, ...categorias.map((c) => ({ valor: c, texto: c }))]}
          />
          <Campo
            rotulo="Nova categoria (preencha só se precisar de uma categoria que não está na lista acima)"
            name="novaCategoria"
            placeholder="Opcional"
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Preço de venda" name="preco" type="number" step="any" defaultValue={produto.preco} required />
            <Campo
              rotulo="Taxa utilidades (%)"
              name="taxaOverhead"
              type="number"
              step="any"
              defaultValue={produto.taxaOverhead}
            />
          </div>
          <CampoArea rotulo="Descrição" name="descricao" defaultValue={produto.descricao ?? ""} rows={3} />
          <Botao type="submit">Salvar</Botao>
        </form>
        <form action={remover} className="mt-3">
          <Botao type="submit" perigo>
            Remover produto
          </Botao>
        </form>

        <div className="mt-6 space-y-1 border-t border-borda pt-4 text-sm">
          <p className="font-bold text-terracota-vibrante">
            Custo: ingredientes R$ {detalhe.ingredientes.toFixed(2)} + utilidades R$ {detalhe.overhead.toFixed(2)} +
            embalagem R$ {detalhe.embalagens.toFixed(2)}
          </p>
          <p className="font-bold text-terracota-vibrante">Custo total: R$ {detalhe.total.toFixed(2)}</p>
          <p className={`font-bold ${margem.margemReais >= 0 ? "text-terracota-vibrante" : "text-alerta"}`}>
            Margem: R$ {margem.margemReais.toFixed(2)} ({margem.margemPercentual.toFixed(1)}%)
          </p>
        </div>
      </Cartao>

      <div className="space-y-6">
        <Cartao titulo="Ingredientes da receita">
          <ul className="mb-4 space-y-2 text-sm">
            {ingredientesReceita.length === 0 && <li className="text-texto-suave">Nenhum ingrediente adicionado.</li>}
            {ingredientesReceita.map((i) => {
              const removerEsteIngrediente = removerIngredienteReceita.bind(null, produtoId, i.id);
              return (
                <li key={i.id} className="flex items-center justify-between rounded-xl bg-painel-claro px-3 py-2">
                  <span>
                    {i.nome} — {i.quantidade} {i.unidade}
                  </span>
                  <form action={removerEsteIngrediente}>
                    <button className="text-xs font-bold text-alerta hover:underline">remover</button>
                  </form>
                </li>
              );
            })}
          </ul>
          <form action={addIngrediente} className="flex items-end gap-2">
            <CampoSelect
              name="ingredienteId"
              opcoes={todosIngredientes.map((i) => ({ valor: String(i.id), texto: `${i.nome} (${i.unidade})` }))}
              className="flex-1"
            />
            <Campo name="quantidade" type="number" step="any" placeholder="Qtd" className="w-24" />
            <Botao type="submit">+ Adicionar</Botao>
          </form>
        </Cartao>

        <Cartao titulo="Embalagens usadas">
          <ul className="mb-4 space-y-2 text-sm">
            {embalagensReceita.length === 0 && <li className="text-texto-suave">Nenhuma embalagem adicionada.</li>}
            {embalagensReceita.map((e) => {
              const removerEstaEmbalagem = removerEmbalagemReceita.bind(null, produtoId, e.id);
              return (
                <li key={e.id} className="flex items-center justify-between rounded-xl bg-painel-claro px-3 py-2">
                  <span>
                    {e.nome} — {e.quantidade}x
                  </span>
                  <form action={removerEstaEmbalagem}>
                    <button className="text-xs font-bold text-alerta hover:underline">remover</button>
                  </form>
                </li>
              );
            })}
          </ul>
          <form action={addEmbalagem} className="flex items-end gap-2">
            <CampoSelect
              name="embalagemId"
              opcoes={todasEmbalagens.map((e) => ({ valor: String(e.id), texto: e.nome }))}
              className="flex-1"
            />
            <Campo name="quantidade" type="number" step="any" defaultValue={1} placeholder="Qtd" className="w-24" />
            <Botao type="submit">+ Adicionar</Botao>
          </form>
        </Cartao>
      </div>
    </div>
  );
}
