import { notFound } from "next/navigation";
import * as pedidos from "@/lib/pedidos";
import * as produtos from "@/lib/produtos";
import * as pagamentosLib from "@/lib/pagamentos";
import {
  atualizarDadosPedido,
  removerPedido,
  adicionarItemPedido,
  atualizarQuantidadeItem,
  removerItemPedido,
  registrarPagamento,
  removerPagamento,
} from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";

const FORMAS_PAGAMENTO = ["", "pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"];
const ROTULOS_TIPO: Record<string, string> = {
  encomenda: "Encomenda",
  pronta_entrega: "Pronta entrega",
};

export default async function DetalhePedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedidoId = Number(id);
  const { pedido, itens } = await pedidos.buscarPedido(pedidoId);
  if (!pedido) notFound();

  const todosProdutos = await produtos.listarProdutos();
  const produtosParaAdicionar =
    pedido.tipo === "pronta_entrega" ? todosProdutos.filter((p) => p.estoqueProduzido > 0) : todosProdutos;
  const totalItens = itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);
  const total = totalItens + pedido.taxaEntrega;

  const listaPagamentos = await pagamentosLib.listarPagamentosDoPedido(pedidoId);
  const totalRecebido = listaPagamentos.reduce((soma, p) => soma + p.valor, 0);
  const saldoPendente = total - totalRecebido;

  const salvar = atualizarDadosPedido.bind(null, pedidoId);
  const remover = removerPedido.bind(null, pedidoId);
  const addItem = adicionarItemPedido.bind(null, pedidoId);
  const addPagamento = registrarPagamento.bind(null, pedidoId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Cartao titulo={`Pedido #${pedido.id}`}>
        <p className="mb-3 text-sm text-texto-suave">
          Criado em: {pedido.dataPedido.slice(0, 10).split("-").reverse().join("/")} {pedido.dataPedido.slice(11, 16)}
        </p>
        <form action={salvar} className="space-y-4">
          <CampoSelect
            rotulo="Tipo de pedido"
            name="tipo"
            defaultValue={pedido.tipo}
            opcoes={pedidos.TIPOS_PEDIDO.map((t) => ({ valor: t, texto: ROTULOS_TIPO[t] ?? t }))}
          />
          <Campo rotulo="Cliente" name="cliente" defaultValue={pedido.clienteNome ?? ""} required />
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Data de entrega" name="dataEntrega" type="date" defaultValue={pedido.dataEntrega ?? ""} />
            <CampoSelect
              rotulo="Forma de pagamento"
              name="formaPagamento"
              defaultValue={pedido.formaPagamento ?? ""}
              opcoes={FORMAS_PAGAMENTO.map((f) => ({ valor: f, texto: f || "-" }))}
            />
          </div>
          <CampoSelect
            rotulo="Status"
            name="status"
            defaultValue={pedido.status}
            opcoes={pedidos.STATUS_PEDIDO.map((s) => ({ valor: s, texto: s }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Caixa" name="caixa" defaultValue={pedido.caixa ?? ""} />
            <Campo
              rotulo="Taxa de entrega"
              name="taxaEntrega"
              type="number"
              step="any"
              defaultValue={pedido.taxaEntrega}
            />
          </div>
          <Campo rotulo="Observações" name="observacoes" defaultValue={pedido.observacoes ?? ""} />
          <Botao type="submit">Salvar dados do pedido</Botao>
        </form>
        <form action={remover} className="mt-3">
          <Botao type="submit" perigo>
            Remover pedido
          </Botao>
        </form>
      </Cartao>

      <Cartao titulo="Itens do pedido">
        <Tabela>
          <TabelaCabecalho colunas={["Produto", "Qtd", "Preço unit.", "Subtotal", ""]} />
          <tbody>
            {itens.length === 0 && <TabelaVazia colunas={5} texto="Nenhum item." />}
            {itens.map((i) => {
              const salvarQtd = atualizarQuantidadeItem.bind(null, pedidoId, i.id);
              const removerEsteItem = removerItemPedido.bind(null, pedidoId, i.id);
              return (
                <TabelaLinha key={i.id}>
                  <TabelaCelula>{i.produtoNome}</TabelaCelula>
                  <TabelaCelula>
                    <form action={salvarQtd} className="flex items-center gap-1">
                      <input
                        type="number"
                        name="quantidade"
                        defaultValue={i.quantidade}
                        min={1}
                        className="w-16 rounded-full border border-borda px-2 py-1 text-sm"
                      />
                      <button type="submit" className="text-xs font-bold text-terracota hover:underline">
                        salvar
                      </button>
                    </form>
                  </TabelaCelula>
                  <TabelaCelula>R$ {i.precoUnitario.toFixed(2)}</TabelaCelula>
                  <TabelaCelula>R$ {(i.quantidade * i.precoUnitario).toFixed(2)}</TabelaCelula>
                  <TabelaCelula>
                    <form action={removerEsteItem}>
                      <button className="text-xs font-bold text-alerta hover:underline">remover</button>
                    </form>
                  </TabelaCelula>
                </TabelaLinha>
              );
            })}
          </tbody>
        </Tabela>
        <p className="mt-3 text-right font-titulo text-lg text-terracota-vibrante">Total: R$ {total.toFixed(2)}</p>

        {pedido.tipo === "pronta_entrega" && produtosParaAdicionar.length === 0 ? (
          <p className="mt-4 border-t border-borda pt-4 text-sm text-texto-suave">
            Nenhum produto com estoque pronto no momento. Produza algo no Planejador primeiro.
          </p>
        ) : (
          <form action={addItem} className="mt-4 flex flex-col gap-2 border-t border-borda pt-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <CampoSelect
                name="produtoId"
                opcoes={produtosParaAdicionar.map((p) => ({
                  valor: String(p.id),
                  texto: `${p.nome} (R$ ${p.preco.toFixed(2)})${
                    pedido.tipo === "pronta_entrega" ? ` — ${p.estoqueProduzido} em estoque` : ""
                  }`,
                }))}
              />
            </div>
            <input
              type="number"
              name="quantidade"
              min={1}
              defaultValue={1}
              className="w-full rounded-full border border-borda px-3 py-2 text-sm sm:w-20"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-terracota px-4 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover sm:w-auto"
            >
              + Adicionar item
            </button>
          </form>
        )}
      </Cartao>

      <Cartao titulo="Pagamentos recebidos" className="lg:col-span-2">
        <p className="mb-3 text-sm text-texto-suave">
          Registre aqui cada valor efetivamente recebido, na data real em que caiu — mesmo que em parcelas, em meses
          diferentes da venda. Isso alimenta o <strong>Financeiro</strong> separado do status de produção/entrega
          acima.
        </p>
        <ul className="mb-4 space-y-2 text-sm">
          {listaPagamentos.length === 0 && <li className="text-texto-suave">Nenhum pagamento registrado ainda.</li>}
          {listaPagamentos.map((p) => {
            const removerEste = removerPagamento.bind(null, pedidoId, p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-painel-claro px-3 py-2">
                <span>
                  {p.data.split("-").reverse().join("/")} — R$ {p.valor.toFixed(2)}
                  {p.observacoes ? ` (${p.observacoes})` : ""}
                </span>
                <form action={removerEste}>
                  <button type="submit" className="text-xs font-bold text-alerta hover:underline">
                    remover
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <form action={addPagamento} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Campo rotulo="Valor recebido" name="valor" type="number" step="any" className="w-full sm:w-32" required />
          <Campo rotulo="Data" name="data" type="date" className="w-full sm:w-40" required />
          <Campo rotulo="Observações (opcional)" name="observacoes" className="w-full sm:flex-1" />
          <Botao type="submit" className="w-full sm:w-auto">
            + Registrar
          </Botao>
        </form>
        <p className="mt-3 text-sm">
          <span className="text-texto-suave">Total recebido: </span>
          <strong className="text-salvia">R$ {totalRecebido.toFixed(2)}</strong>
          <span className="text-texto-suave"> · Saldo pendente: </span>
          <strong className={saldoPendente > 0.009 ? "text-alerta" : "text-salvia"}>
            R$ {Math.max(saldoPendente, 0).toFixed(2)}
          </strong>
        </p>
      </Cartao>
    </div>
  );
}
