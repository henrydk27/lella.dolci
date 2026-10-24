import * as pedidos from "@/lib/pedidos";
import { Cartao } from "@/components/ui/Cartao";
import { CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";

function dataBr(iso: string) {
  return iso.slice(0, 10).split("-").reverse().join("/") + " " + iso.slice(11, 16);
}

const ROTULOS_TIPO: Record<string, string> = {
  encomenda: "Encomenda",
  pronta_entrega: "Pronta entrega",
};

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string; status?: string; tipo?: string }>;
}) {
  const { inicio, fim, status, tipo } = await searchParams;

  const registros = await pedidos.historicoVendas(inicio, fim, status, tipo);
  const totaisItens = await pedidos.totaisPorPedidoIds(registros.map((p) => p.id));
  const registrosComTotal = registros.map((p) => ({
    ...p,
    total: (totaisItens.get(p.id) ?? 0) + p.taxaEntrega,
  }));
  const resumo = await pedidos.resumoVendas(inicio, fim, tipo);
  const resumoPorTipo = await pedidos.resumoPorTipo(inicio, fim);

  return (
    <div className="space-y-6">
      <h2 className="font-titulo text-xl text-terracota-vibrante">Histórico de vendas</h2>

      <Cartao>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-texto">De</span>
            <input
              type="date"
              name="inicio"
              defaultValue={inicio}
              className="rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-texto">Até</span>
            <input
              type="date"
              name="fim"
              defaultValue={fim}
              className="rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
            />
          </label>
          <CampoSelect
            rotulo="Status"
            name="status"
            defaultValue={status ?? ""}
            opcoes={[{ valor: "", texto: "todos" }, ...pedidos.STATUS_PEDIDO.map((s) => ({ valor: s, texto: s }))]}
          />
          <CampoSelect
            rotulo="Tipo"
            name="tipo"
            defaultValue={tipo ?? ""}
            opcoes={[
              { valor: "", texto: "todos" },
              ...pedidos.TIPOS_PEDIDO.map((t) => ({ valor: t, texto: ROTULOS_TIPO[t] ?? t })),
            ]}
          />
          <Botao type="submit">Filtrar</Botao>
          <a href="/historico">
            <Botao type="button" variante="fantasma">
              Limpar
            </Botao>
          </a>
        </form>
      </Cartao>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pedidos.TIPOS_PEDIDO.map((t) => (
          <Cartao key={t} titulo={ROTULOS_TIPO[t] ?? t}>
            <p className="font-titulo text-2xl text-texto">R$ {resumoPorTipo[t].totalVendas.toFixed(2)}</p>
            <p className="mt-1 text-sm text-texto-suave">{resumoPorTipo[t].quantidadePedidos} pedido(s) pago(s)</p>
          </Cartao>
        ))}
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["ID", "Cliente", "Tipo", "Data", "Status", "Total"]} />
        <tbody>
          {registrosComTotal.length === 0 && <TabelaVazia colunas={6} texto="Nenhum registro encontrado." />}
          {registrosComTotal.map((p) => (
            <TabelaLinha key={p.id}>
              <TabelaCelula>#{p.id}</TabelaCelula>
              <TabelaCelula>{p.clienteNome ?? "-"}</TabelaCelula>
              <TabelaCelula>{ROTULOS_TIPO[p.tipo] ?? p.tipo}</TabelaCelula>
              <TabelaCelula>{dataBr(p.dataPedido)}</TabelaCelula>
              <TabelaCelula>{p.status}</TabelaCelula>
              <TabelaCelula>R$ {p.total.toFixed(2)}</TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>

      <p className="text-center font-titulo text-lg text-terracota-vibrante">
        Pedidos pagos: {resumo.quantidadePedidos} · Total vendido: R$ {resumo.totalVendas.toFixed(2)}
      </p>
    </div>
  );
}
