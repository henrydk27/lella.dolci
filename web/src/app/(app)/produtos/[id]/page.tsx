import Link from "next/link";
import { notFound } from "next/navigation";
import * as produtos from "@/lib/produtos";
import * as ingredientesLib from "@/lib/ingredientes";
import * as embalagensLib from "@/lib/embalagens";
import * as receitasLib from "@/lib/receitas";
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

export default async function EditarProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const produtoId = Number(id);
  const produto = await produtos.buscarProduto(produtoId);
  if (!produto) notFound();

  const categorias = await produtos.listarCategorias();
  const todasReceitas = await receitasLib.listarReceitas();
  const receitaVinculada = produto.receitaId ? todasReceitas.find((r) => r.id === produto.receitaId) : undefined;
  const ingredientesDoProduto = await produtos.listarIngredientesDoProduto(produtoId);
  const ingredientesDaReceitaVinculada = produto.receitaId
    ? await receitasLib.listarIngredientesDaReceita(produto.receitaId)
    : [];
  const embalagensReceita = await produtos.listarEmbalagensDoProduto(produtoId);

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
          <CampoSelect
            rotulo="Receita vinculada (opcional) — define o custo automaticamente"
            name="receitaId"
            defaultValue={produto.receitaId ? String(produto.receitaId) : ""}
            opcoes={[
              { valor: "", texto: "Nenhuma (usar os ingredientes/embalagens abaixo)" },
              ...todasReceitas.map((r) => ({ valor: String(r.id), texto: r.nome })),
            ]}
          />
          <CampoArea rotulo="Descrição" name="descricao" defaultValue={produto.descricao ?? ""} rows={3} />
          <label className="flex items-center gap-2 text-sm text-texto">
            <input
              type="checkbox"
              name="disponivelNaCaixa"
              defaultChecked={produto.disponivelNaCaixa}
              className="h-4 w-4 rounded border-borda"
            />
            Pode ser escolhido como sabor ao montar uma caixa (brigadeiro, beijinho, etc)
          </label>
          <Botao type="submit">Salvar</Botao>
        </form>
        {receitaVinculada && (
          <p className="mt-3 rounded-xl border border-borda bg-painel-claro px-4 py-3 text-xs text-texto-suave">
            Este produto está usando o custo da receita <strong>{receitaVinculada.nome}</strong> — qualquer alteração
            nela (ingredientes ou taxa gás/luz/água) atualiza o custo deste produto automaticamente.
          </p>
        )}
        {erro === "tem-pedidos" && (
          <p className="mt-3 rounded-xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta">
            Este produto não pode ser removido porque já existem pedidos com ele — removê-lo apagaria esse histórico
            de vendas. Se não quiser mais vendê-lo, edite o nome para indicar isso (ex: &quot;(descontinuado)&quot;)
            ou simplesmente pare de usá-lo em novos pedidos.
          </p>
        )}
        <form action={remover} className="mt-3">
          <Botao type="submit" perigo>
            Remover produto
          </Botao>
        </form>
      </Cartao>

      <div className="space-y-6">
        <Cartao titulo={receitaVinculada ? `Ingredientes (receita: ${receitaVinculada.nome})` : "Ingredientes da receita"}>
          {receitaVinculada ? (
            <>
              <ul className="space-y-2 text-sm">
                {ingredientesDaReceitaVinculada.length === 0 && (
                  <li className="text-texto-suave">Nenhum ingrediente nessa receita ainda.</li>
                )}
                {ingredientesDaReceitaVinculada.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-xl bg-painel-claro px-3 py-2">
                    <span>
                      {i.nome} — {i.gramasUsadas}g
                    </span>
                    <span className="text-texto-suave">R$ {(i.gramasUsadas * i.precoPorGrama).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-texto-suave">
                Esses ingredientes vem da receita vinculada — pra adicionar, remover ou ajustar quantidades, edite em{" "}
                <Link href="/calculadora/receitas" className="font-bold text-terracota hover:underline">
                  Calculadora → Receitas prontas
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <ul className="mb-4 space-y-2 text-sm">
                {ingredientesDoProduto.length === 0 && <li className="text-texto-suave">Nenhum ingrediente adicionado.</li>}
                {ingredientesDoProduto.map((i) => {
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
              <form action={addIngrediente} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <CampoSelect
                    name="ingredienteId"
                    opcoes={todosIngredientes.map((i) => ({ valor: String(i.id), texto: `${i.nome} (${i.unidade})` }))}
                  />
                </div>
                <Campo name="quantidade" type="number" step="any" placeholder="Qtd" className="w-full sm:w-24" />
                <Botao type="submit" className="w-full sm:w-auto">
                  + Adicionar
                </Botao>
              </form>
            </>
          )}
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
          <form action={addEmbalagem} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <CampoSelect name="embalagemId" opcoes={todasEmbalagens.map((e) => ({ valor: String(e.id), texto: e.nome }))} />
            </div>
            <Campo name="quantidade" type="number" step="any" defaultValue={1} placeholder="Qtd" className="w-full sm:w-24" />
            <Botao type="submit" className="w-full sm:w-auto">
              + Adicionar
            </Botao>
          </form>
        </Cartao>
      </div>
    </div>
  );
}
