import Link from "next/link";
import * as pedidos from "@/lib/pedidos";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

function dataBr(iso: string) {
  return iso.slice(0, 10).split("-").reverse().join("/") + " " + iso.slice(11, 16);
}

const ROTULOS_TIPO: Record<string, string> = {
  encomenda: "Encomenda",
  pronta_entrega: "Pronta entrega",
};

const ABAS = [
  { valor: "", texto: "Todos" },
  { valor: "encomenda", texto: "Encomendas" },
  { valor: "pronta_entrega", texto: "Pronta entrega" },
];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const todos = await pedidos.listarPedidos();
  const itens = tipo ? todos.filter((p) => p.tipo === tipo) : todos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Pedidos</h2>
        <Link href="/pedidos/novo">
          <Botao>+ Novo pedido</Botao>
        </Link>
      </div>

      <div className="flex gap-2">
        {ABAS.map((aba) => (
          <Link
            key={aba.valor}
            href={aba.valor ? `/pedidos?tipo=${aba.valor}` : "/pedidos"}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              (tipo ?? "") === aba.valor
                ? "bg-terracota text-[#FFF9F0]"
                : "border border-borda bg-painel-claro text-texto hover:bg-selecao"
            }`}
          >
            {aba.texto}
          </Link>
        ))}
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["ID", "Cliente", "Tipo", "Data", "Entrega", "Pagamento", "Status", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={8} texto="Nenhum pedido cadastrado." />}
          {itens.map((p) => (
            <TabelaLinha key={p.id}>
              <TabelaCelula>#{p.id}</TabelaCelula>
              <TabelaCelula>{p.clienteNome ?? "-"}</TabelaCelula>
              <TabelaCelula>{ROTULOS_TIPO[p.tipo] ?? p.tipo}</TabelaCelula>
              <TabelaCelula>{dataBr(p.dataPedido)}</TabelaCelula>
              <TabelaCelula>{p.dataEntrega ? p.dataEntrega.split("-").reverse().join("/") : "-"}</TabelaCelula>
              <TabelaCelula>{p.formaPagamento ?? "-"}</TabelaCelula>
              <TabelaCelula>{p.status}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/pedidos/${p.id}`} className="font-bold text-terracota hover:underline">
                  Ver
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
