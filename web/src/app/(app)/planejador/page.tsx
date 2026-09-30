import * as planejador from "@/lib/planejador";
import * as produtos from "@/lib/produtos";
import { adicionarItem, removerItem, concluirItem, reabrirItem, moverItem } from "./actions";
import { Cartao } from "@/components/ui/Cartao";
import { CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { SeletorData } from "./SeletorData";

export default async function PlanejadorPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const dataAtual = data ?? new Date().toISOString().slice(0, 10);

  const itens = await planejador.listarItensDoDia(dataAtual);
  const listaProdutos = await produtos.listarProdutos();

  const pendentes = itens.filter((i) => !i.concluido);
  const concluidos = itens.filter((i) => i.concluido);

  const addItem = adicionarItem.bind(null, dataAtual);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Planejador de produção</h2>
        <SeletorData data={dataAtual} />
      </div>

      <Cartao titulo="O que será feito hoje?">
        <form action={addItem} className="flex flex-wrap items-end gap-2">
          <CampoSelect
            rotulo="Produto"
            name="produtoId"
            className="min-w-48 flex-1"
            opcoes={listaProdutos.map((p) => ({ valor: String(p.id), texto: p.nome }))}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-texto">Quantidade</span>
            <input
              type="number"
              name="quantidadePlanejada"
              min={1}
              defaultValue={1}
              className="w-24 rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
            />
          </label>
          <Botao type="submit">+ Adicionar ao plano</Botao>
        </form>
      </Cartao>

      <div>
        <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">
          Fila de produção {pendentes.length > 0 && `(${pendentes.length})`}
        </h3>
        {pendentes.length === 0 ? (
          <p className="text-sm text-texto-suave">Nada planejado para este dia ainda.</p>
        ) : (
          <div className="space-y-3">
            {pendentes.map((item, indice) => {
              const mover = moverItem.bind(null, dataAtual, item.id);
              const moverCima = mover.bind(null, "cima");
              const moverBaixo = mover.bind(null, "baixo");
              const concluir = concluirItem.bind(null, dataAtual, item.id);
              const remover = removerItem.bind(null, dataAtual, item.id);

              return (
                <Cartao key={item.id} className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-texto-suave">
                        {indice === 0 ? "PRÓXIMO" : `${indice + 1}º NA FILA`}
                      </span>
                      <p className="font-titulo text-lg text-texto">
                        {item.produtoNome} — {item.quantidadePlanejada}x
                      </p>
                      {item.ingredientesNecessarios.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-sm text-texto-suave">
                          {item.ingredientesNecessarios.map((ing, i) => (
                            <li key={i}>
                              {ing.nome}: {ing.quantidadeNecessaria} {ing.unidade}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <form action={moverCima}>
                        <button
                          type="submit"
                          disabled={indice === 0}
                          className="rounded-full border border-borda bg-painel-claro px-2 py-1 text-xs font-bold hover:bg-selecao disabled:opacity-30"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moverBaixo}>
                        <button
                          type="submit"
                          disabled={indice === pendentes.length - 1}
                          className="rounded-full border border-borda bg-painel-claro px-2 py-1 text-xs font-bold hover:bg-selecao disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-borda pt-3">
                    <form action={concluir} className="flex items-end gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-texto">Quantidade produzida</span>
                        <input
                          type="number"
                          name="quantidadeProduzida"
                          step="any"
                          defaultValue={item.quantidadePlanejada}
                          className="w-28 rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
                        />
                      </label>
                      <Botao type="submit">✓ Concluído</Botao>
                    </form>
                    <form action={remover}>
                      <Botao type="submit" perigo>
                        Remover
                      </Botao>
                    </form>
                  </div>
                </Cartao>
              );
            })}
          </div>
        )}
      </div>

      {concluidos.length > 0 && (
        <div>
          <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">Concluídos</h3>
          <div className="space-y-2">
            {concluidos.map((item) => {
              const reabrir = reabrirItem.bind(null, dataAtual, item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-borda bg-painel-claro px-4 py-3"
                >
                  <p className="text-sm text-texto-suave line-through">
                    {item.produtoNome} — planejado {item.quantidadePlanejada}x, produzido{" "}
                    {item.quantidadeProduzida ?? 0}x
                  </p>
                  <form action={reabrir}>
                    <button className="text-xs font-bold text-terracota hover:underline">reabrir</button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
