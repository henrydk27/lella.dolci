"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { criarPedido } from "../actions";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";

type Produto = { id: number; nome: string; preco: number; estoqueProduzido: number };

const FORMAS_PAGAMENTO = ["", "pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"];

const TIPOS_PEDIDO = [
  { valor: "encomenda", texto: "Encomenda", descricao: "Personalizado, feito sob demanda" },
  { valor: "pronta_entrega", texto: "Pronta entrega", descricao: "Produto ja pronto no estoque" },
];

const OPCOES_CAIXA = ["", "Caixa com 4", "Caixa com 6"];

function tamanhoDaCaixa(valor: string): number {
  if (valor === "Caixa com 4") return 4;
  if (valor === "Caixa com 6") return 6;
  return 0;
}

// Preco fixo da caixa fechada, independente dos sabores escolhidos
// (e' assim que sempre foi cobrado, visto no historico de vendas).
const PRECO_CAIXA: Record<number, number> = { 4: 10, 6: 14 };

export function NovoPedidoForm({ produtos, nomesClientes }: { produtos: Produto[]; nomesClientes: string[] }) {
  const [itens, setItens] = useState<{ produtoId: number; nome: string; quantidade: number; precoUnitario: number }[]>(
    []
  );
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState("encomenda");
  const [erro, setErro] = useState("");

  const [caixaValor, setCaixaValor] = useState("");
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [saborSelecionado, setSaborSelecionado] = useState(0);
  const [erroCaixa, setErroCaixa] = useState("");
  // Evita ler um "slots" desatualizado quando o usuario clica em Adicionar
  // mais de uma vez em sequencia rapida, antes do re-render acontecer.
  const slotsRef = useRef<(number | null)[]>([]);
  slotsRef.current = slots;

  const prontaEntrega = tipo === "pronta_entrega";

  // Na pronta entrega so faz sentido vender o que ja esta pronto no estoque.
  const produtosDisponiveis = useMemo(
    () => (prontaEntrega ? produtos.filter((p) => p.estoqueProduzido > 0) : produtos),
    [prontaEntrega, produtos]
  );

  const brigadeiros = useMemo(
    () => produtosDisponiveis.filter((p) => p.nome.trim().toLowerCase().startsWith("brigadeiro")),
    [produtosDisponiveis]
  );

  const [produtoSelecionado, setProdutoSelecionado] = useState(produtosDisponiveis[0]?.id ?? 0);

  useEffect(() => {
    setItens([]);
    setErro("");
    setProdutoSelecionado(produtosDisponiveis[0]?.id ?? 0);
    setCaixaValor("");
    slotsRef.current = [];
    setSlots([]);
    setErroCaixa("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    setSaborSelecionado(brigadeiros[0]?.id ?? 0);
  }, [brigadeiros]);

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

  function selecionarCaixa(valor: string) {
    const novosSlots = new Array(tamanhoDaCaixa(valor)).fill(null);
    setCaixaValor(valor);
    slotsRef.current = novosSlots;
    setSlots(novosSlots);
    setErroCaixa("");
  }

  function adicionarSaborNaCaixa() {
    setErroCaixa("");
    const produto = brigadeiros.find((p) => p.id === saborSelecionado);
    if (!produto) return;

    const atual = slotsRef.current;
    const indiceVazio = atual.findIndex((s) => s === null);
    if (indiceVazio === -1) return;

    if (prontaEntrega) {
      const jaNaCaixa = atual.filter((s) => s === produto.id).length;
      if (jaNaCaixa + 1 > produto.estoqueProduzido) {
        setErroCaixa(`Só tem ${produto.estoqueProduzido} de "${produto.nome}" disponível no estoque.`);
        return;
      }
    }

    const copia = [...atual];
    copia[indiceVazio] = produto.id;
    slotsRef.current = copia;
    setSlots(copia);
  }

  function removerSaborDaCaixa(indice: number) {
    const copia = [...slotsRef.current];
    copia[indice] = null;
    slotsRef.current = copia;
    setSlots(copia);
  }

  const tamanhoCaixa = tamanhoDaCaixa(caixaValor);
  const precoTotalCaixa = PRECO_CAIXA[tamanhoCaixa] ?? 0;

  // Cada sabor escolhido na caixa vira um item do pedido, igual a adicionar
  // manualmente, mas rateando o preco fixo da caixa entre os espacos: o
  // valor cobrado e' sempre o da caixa fechada, nao a soma do preco avulso
  // de cada sabor.
  const itensDaCaixa = useMemo(() => {
    const precoPorUnidade = tamanhoCaixa > 0 ? Math.round((precoTotalCaixa / tamanhoCaixa) * 100) / 100 : 0;
    const contagem = new Map<number, number>();
    for (const produtoId of slots) {
      if (produtoId === null) continue;
      contagem.set(produtoId, (contagem.get(produtoId) ?? 0) + 1);
    }
    return [...contagem.entries()].map(([produtoId, quantidade]) => {
      const produto = brigadeiros.find((p) => p.id === produtoId)!;
      return { produtoId, nome: produto.nome, quantidade, precoUnitario: precoPorUnidade };
    });
  }, [slots, brigadeiros, tamanhoCaixa, precoTotalCaixa]);

  const caixaIncompleta = slots.length > 0 && slots.some((s) => s === null);
  const todosOsItens = [...itens, ...itensDaCaixa];
  const total = todosOsItens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);

  return (
    <form action={criarPedido} className="flex flex-col items-start gap-6 lg:flex-row">
      <input
        type="hidden"
        name="itensJson"
        value={JSON.stringify(todosOsItens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })))}
      />
      <input type="hidden" name="caixa" value={caixaValor} />

      <Cartao titulo="Novo pedido" className="w-full space-y-4 lg:max-w-xl">
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1 block text-xs font-semibold text-texto">Caixa</span>
          <select
            value={caixaValor}
            onChange={(e) => selecionarCaixa(e.target.value)}
            className="w-full rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
          >
            {OPCOES_CAIXA.map((o) => (
              <option key={o} value={o}>
                {o || "-"}
              </option>
            ))}
          </select>
        </div>
        <Campo rotulo="Taxa de entrega" name="taxaEntrega" type="number" step="any" defaultValue={0} />
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
              {itensDaCaixa.map((item) => (
                <li
                  key={`caixa-${item.produtoId}`}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                >
                  <span>
                    {item.quantidade}x {item.nome} — R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                  </span>
                  <span className="text-xs text-texto-suave">da caixa</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-right font-titulo text-lg text-terracota-vibrante">Total: R$ {total.toFixed(2)}</p>
          </>
        )}
      </div>

      <Botao
        type="submit"
        className="w-full"
        disabled={(prontaEntrega && produtosDisponiveis.length === 0) || caixaIncompleta}
      >
        Finalizar pedido
      </Botao>
      </Cartao>

      {caixaValor && (
        <Cartao titulo="Monte a caixa" className="w-full lg:max-w-sm">
          <p className="mb-3 text-sm text-texto-suave">
            Preço da caixa fechada: <strong className="text-terracota-vibrante">R$ {precoTotalCaixa.toFixed(2)}</strong>
            , não importa a combinação de sabores.
          </p>
          {brigadeiros.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Nenhum sabor de brigadeiro disponível{prontaEntrega ? " em estoque" : ""}.
            </p>
          ) : (
            <>
              <div className={`mb-3 grid gap-3 ${slots.length === 6 ? "grid-cols-3" : "grid-cols-2"}`}>
                {slots.map((produtoId, indice) => {
                  const produto = brigadeiros.find((p) => p.id === produtoId);
                  return (
                    <button
                      key={indice}
                      type="button"
                      onClick={() => produtoId !== null && removerSaborDaCaixa(indice)}
                      title={produto ? "Remover" : undefined}
                      className={`flex aspect-square items-center justify-center rounded-full p-2 text-center text-xs font-bold ${
                        produto
                          ? "bg-terracota text-[#FFF9F0]"
                          : "border border-dashed border-borda text-texto-suave"
                      }`}
                    >
                      {produto ? produto.nome.replace(/^brigadeiro\s*/i, "") || "Brigadeiro" : "vazio"}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-end gap-2">
                <select
                  value={saborSelecionado}
                  onChange={(e) => setSaborSelecionado(Number(e.target.value))}
                  className="flex-1 rounded-full border border-borda bg-white px-3 py-2 text-sm"
                >
                  {brigadeiros.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={adicionarSaborNaCaixa}
                  disabled={!slots.some((s) => s === null)}
                  className="rounded-full bg-terracota px-4 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover disabled:opacity-50"
                >
                  + Adicionar
                </button>
              </div>

              {erroCaixa && <p className="mt-2 text-sm font-bold text-alerta">{erroCaixa}</p>}

              <p className="mt-2 text-sm text-texto-suave">
                {slots.filter((s) => s !== null).length}/{slots.length} preenchidos
              </p>
              {caixaIncompleta && (
                <p className="mt-1 text-sm font-bold text-alerta">
                  Preencha todos os espaços da caixa para finalizar o pedido.
                </p>
              )}
            </>
          )}
        </Cartao>
      )}
    </form>
  );
}
