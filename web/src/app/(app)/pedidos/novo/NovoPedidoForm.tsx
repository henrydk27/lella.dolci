"use client";

import { useEffect, useMemo, useState } from "react";
import { criarPedido } from "../actions";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

type Produto = { id: number; nome: string; preco: number; estoqueProduzido: number };

const FORMAS_PAGAMENTO = ["", "pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"];

const TIPOS_PEDIDO = [
  { valor: "encomenda", texto: "Encomenda", descricao: "Personalizado, feito sob demanda" },
  { valor: "pronta_entrega", texto: "Pronta entrega", descricao: "Produto ja pronto no estoque" },
];

export function NovoPedidoForm({ produtos, nomesClientes }: { produtos: Produto[]; nomesClientes: string[] }) {
  const [itens, setItens] = useState<{ produtoId: number; nome: string; quantidade: number; precoUnitario: number }[]>(
    []
  );
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState("encomenda");
  const [erro, setErro] = useState("");

  const prontaEntrega = tipo === "pronta_entrega";

  // Na pronta entrega so faz sentido vender o que ja esta pronto no estoque.
  const produtosDisponiveis = useMemo(
    () => (prontaEntrega ? produtos.filter((p) => p.estoqueProduzido > 0) : produtos),
    [prontaEntrega, produtos]
  );

  const [produtoSelecionado, setProdutoSelecionado] = useState(produtosDisponiveis[0]?.id ?? 0);

  useEffect(() => {
    setItens([]);
    setErro("");
    setProdutoSelecionado(produtosDisponiveis[0]?.id ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  function quantidadeJaNoCarrinho(produtoId: number) {
    return itens.filter((i) => i.produtoId === produtoId).reduce((soma, i) => soma + i.quantidade, 0);
  }

  function adicionarItem() {
    setErro("");
    const produto = produtosDisponiveis.find((p) => p.id === produtoSelecionado);
    if (!produto || quantidade <= 0) return;

    if (prontaEntrega) {
      const disponivel = produto.estoqueProduzido - quantidadeJaNoCarrinho(produto.id);
      if (quantidade > disponivel) {
        setErro(`Só tem ${disponivel} de "${produto.nome}" disponível no estoque.`);
        return;
      }
    }

    setItens((atual) => [
      ...atual,
      { produtoId: produto.id, nome: produto.nome, quantidade, precoUnitario: produto.preco },
    ]);
  }

  function removerItem(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice));
  }

  const total = itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);

  return (
    <form action={criarPedido} className="space-y-4">
      <input
        type="hidden"
        name="itensJson"
        value={JSON.stringify(itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })))}
      />

      <input type="hidden" name="tipo" value={tipo} />
      <div>
        <span className="mb-1 block text-xs font-semibold text-texto">Tipo de pedido</span>
        <div className="flex gap-2">
          {TIPOS_PEDIDO.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTipo(t.valor)}
              className={`flex-1 rounded-2xl border px-4 py-2 text-left text-sm transition-colors ${
                tipo === t.valor
                  ? "border-terracota bg-terracota text-[#FFF9F0]"
                  : "border-borda bg-painel-claro text-texto hover:bg-selecao"
              }`}
            >
              <span className="block font-bold">{t.texto}</span>
              <span className={`block text-xs ${tipo === t.valor ? "text-[#FFF9F0]/80" : "text-texto-suave"}`}>
                {t.descricao}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Campo
        rotulo={prontaEntrega ? "Cliente (opcional)" : "Cliente"}
        name="cliente"
        list="clientes-existentes"
        placeholder="Nome do cliente"
        required={!prontaEntrega}
      />
      <datalist id="clientes-existentes">
        {nomesClientes.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        {!prontaEntrega && <Campo rotulo="Data de entrega" name="dataEntrega" type="date" />}
        <CampoSelect
          rotulo="Forma de pagamento"
          name="formaPagamento"
          opcoes={FORMAS_PAGAMENTO.map((f) => ({ valor: f, texto: f || "-" }))}
          className={prontaEntrega ? "col-span-2" : ""}
        />
      </div>

      <Campo rotulo="Observações" name="observacoes" placeholder="Opcional" />

      <div className="rounded-2xl border border-borda bg-painel-claro p-4">
        <p className="mb-2 text-sm font-bold text-terracota-vibrante">
          {prontaEntrega ? "Produtos disponíveis em estoque" : "Itens do pedido"}
        </p>

        {prontaEntrega && produtosDisponiveis.length === 0 ? (
          <p className="text-sm text-texto-suave">
            Nenhum produto com estoque pronto no momento. Produza algo no Planejador primeiro.
          </p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
                className="flex-1 rounded-full border border-borda bg-white px-4 py-2 text-sm"
              >
                {produtosDisponiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (R$ {p.preco.toFixed(2)})
                    {prontaEntrega ? ` — ${p.estoqueProduzido} em estoque` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-20 rounded-full border border-borda bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={adicionarItem}
                className="rounded-full bg-terracota px-4 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover"
              >
                + Adicionar
              </button>
            </div>

            {erro && <p className="mt-2 text-sm font-bold text-alerta">{erro}</p>}

            <ul className="mt-3 space-y-1 text-sm">
              {itens.map((item, indice) => (
                <li key={indice} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>
                    {item.quantidade}x {item.nome} — R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerItem(indice)}
                    className="text-xs font-bold text-alerta hover:underline"
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-right font-titulo text-lg text-terracota-vibrante">Total: R$ {total.toFixed(2)}</p>
          </>
        )}
      </div>

      <Botao type="submit" className="w-full" disabled={prontaEntrega && produtosDisponiveis.length === 0}>
        Finalizar pedido
      </Botao>
    </form>
  );
}
