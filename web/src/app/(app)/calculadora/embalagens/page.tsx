import Link from "next/link";
import * as embalagensLib from "@/lib/embalagens";
import { atualizarEmbalagensNaCalculadora } from "./actions";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";
import { Botao } from "@/components/ui/Botao";

export default async function CalculadoraEmbalagensPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todas = await embalagensLib.listarEmbalagens();
  const itens = todas.filter((e) => correspondeBusca(buscar ?? "", e.nome, e.categoria));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Embalagens</h2>
          <p className="text-sm text-texto-suave">
            Categoria, custo e rendimento podem ser editados direto aqui. Para mudar o nome, as observações ou
            excluir, use o link &quot;Editar&quot; de cada linha.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/embalagens/novo">
            <Botao variante="fantasma">+ Nova embalagem</Botao>
          </Link>
          <Link href="/calculadora" className="whitespace-nowrap text-sm font-bold text-terracota hover:underline">
            Voltar
          </Link>
        </div>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar por nome ou categoria" />

      <form action={atualizarEmbalagensNaCalculadora} className="space-y-4">
        <input type="hidden" name="ids" value={itens.map((e) => e.id).join(",")} />

        <div className="flex justify-end">
          <Botao type="submit">Salvar alterações</Botao>
        </div>

        <Tabela>
          <TabelaCabecalho colunas={["Nome", "Categoria", "Custo total", "Rendimento", "Custo por unidade", ""]} />
          <tbody>
            {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhuma embalagem encontrada." />}
            {itens.map((e) => (
              <TabelaLinha key={e.id}>
                <TabelaCelula>{e.nome}</TabelaCelula>
                <TabelaCelula>
                  <select
                    name={`categoria-${e.id}`}
                    defaultValue={e.categoria ?? ""}
                    className="rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  >
                    <option value="">-</option>
                    {embalagensLib.CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </TabelaCelula>
                <TabelaCelula>
                  <span className="mr-1">R$</span>
                  <input
                    name={`custoTotal-${e.id}`}
                    type="number"
                    step="any"
                    defaultValue={e.custoTotal}
                    className="w-24 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  />
                </TabelaCelula>
                <TabelaCelula>
                  <input
                    name={`rendimento-${e.id}`}
                    type="number"
                    step="1"
                    defaultValue={e.rendimento}
                    className="w-20 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  />
                </TabelaCelula>
                <TabelaCelula>R$ {embalagensLib.calcularCustoUnitario(e).toFixed(4)}</TabelaCelula>
                <TabelaCelula>
                  <Link href={`/embalagens/${e.id}`} className="font-bold text-terracota hover:underline">
                    Editar
                  </Link>
                </TabelaCelula>
              </TabelaLinha>
            ))}
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
