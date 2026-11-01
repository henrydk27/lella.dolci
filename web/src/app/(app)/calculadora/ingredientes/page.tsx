import Link from "next/link";
import * as ingredientesLib from "@/lib/ingredientes";
import { atualizarIngredientesNaCalculadora } from "./actions";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";
import { Botao } from "@/components/ui/Botao";
import { formatarPrecoBase } from "@/lib/ingredientes";

export default async function CalculadoraIngredientesPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todos = await ingredientesLib.listarIngredientes();
  const itens = todos.filter((i) => correspondeBusca(buscar ?? "", i.nome));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Custo dos ingredientes</h2>
          <p className="text-sm text-texto-suave">
            Tipo, peso/quantidade e preço podem ser editados direto aqui. Para mudar o nome, o estoque ou excluir, use
            o link &quot;Editar&quot; de cada linha.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ingredientes/novo">
            <Botao variante="fantasma">+ Novo ingrediente</Botao>
          </Link>
          <Link href="/calculadora" className="whitespace-nowrap text-sm font-bold text-terracota hover:underline">
            Voltar
          </Link>
        </div>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar ingrediente" />

      {/* Um unico form envolvendo a tabela inteira: um clique em "Salvar
          alteracoes" no topo salva todas as linhas de uma vez, sem precisar
          rolar ate o fim de cada linha. */}
      <form action={atualizarIngredientesNaCalculadora} className="space-y-4">
        <input type="hidden" name="ids" value={itens.map((i) => i.id).join(",")} />

        <div className="flex justify-end">
          <Botao type="submit">Salvar alterações</Botao>
        </div>

        <Tabela>
          <TabelaCabecalho
            colunas={["Ingrediente", "Tipo", "Peso/Qtd. da embalagem fechada", "Custo da embalagem", "Custo por peso/unidade", ""]}
          />
          <tbody>
            {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhum ingrediente encontrado." />}
            {itens.map((i) => {
              const porUnidade = i.unidade === "un";
              return (
                <TabelaLinha key={i.id}>
                  <TabelaCelula>{i.nome}</TabelaCelula>
                  <TabelaCelula>
                    <select
                      name={`unidade-${i.id}`}
                      defaultValue={porUnidade ? "un" : "g"}
                      className="rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                    >
                      <option value="g">Por peso (g)</option>
                      <option value="un">Por unidade</option>
                    </select>
                  </TabelaCelula>
                  <TabelaCelula>
                    <input
                      name={`gramasPorEmbalagem-${i.id}`}
                      type="number"
                      step="any"
                      defaultValue={i.gramasPorEmbalagem}
                      className="w-24 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                    />{" "}
                    <span className="text-xs text-texto-suave">{porUnidade ? "un" : "g"}</span>
                  </TabelaCelula>
                  <TabelaCelula>
                    <span className="mr-1">R$</span>
                    <input
                      name={`precoEmbalagem-${i.id}`}
                      type="number"
                      step="any"
                      defaultValue={i.precoEmbalagem}
                      className="w-24 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                    />
                  </TabelaCelula>
                  <TabelaCelula>
                    R$ {formatarPrecoBase(i.precoUnitario)}
                    {porUnidade ? "/un" : "/g"}
                  </TabelaCelula>
                  <TabelaCelula>
                    <Link href={`/ingredientes/${i.id}`} className="font-bold text-terracota hover:underline">
                      Editar
                    </Link>
                  </TabelaCelula>
                </TabelaLinha>
              );
            })}
          </tbody>
        </Tabela>

        {itens.length > 0 && (
          <div className="flex justify-end">
            <Botao type="submit">Salvar alterações</Botao>
          </div>
        )}
      </form>
    </div>
  );
}
