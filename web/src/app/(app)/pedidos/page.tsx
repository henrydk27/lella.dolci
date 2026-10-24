import Link from "next/link";
import * as pedidos from "@/lib/pedidos";
import { Tabela, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

function dataBr(iso: string) {
  return iso.slice(0, 10).split("-").reverse().join("/");
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

type Pedido = Awaited<ReturnType<typeof pedidos.listarPedidos>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "id", rotulo: "ID" },
  { campo: "cliente", rotulo: "Cliente" },
  { campo: "tipo", rotulo: "Tipo" },
  { campo: "data", rotulo: "Data" },
  { campo: "entrega", rotulo: "Entrega" },
  { campo: "pagamento", rotulo: "Pagamento" },
  { campo: "status", rotulo: "Status" },
];

function valorOrdenavel(p: Pedido, campo: string): string | number {
  switch (campo) {
    case "id":
      return p.id;
    case "cliente":
      return (p.clienteNome ?? "").toLowerCase();
    case "tipo":
      return ROTULOS_TIPO[p.tipo] ?? p.tipo;
    case "data":
      return p.dataPedido;
    case "entrega":
      return p.dataEntrega ?? "";
    case "pagamento":
      return p.formaPagamento ?? "";
    case "status":
      return p.status;
    default:
      return "";
  }
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; ordenar?: string; dir?: string }>;
}) {
  const { tipo, ordenar, dir } = await searchParams;
  const todos = await pedidos.listarPedidos();
  const itens = tipo ? todos.filter((p) => p.tipo === tipo) : todos;

  const campoAtivo = COLUNAS_ORDENAVEIS.some((c) => c.campo === ordenar) ? ordenar! : "data";
  const direcao = dir === "asc" ? "asc" : "desc";

  const itensOrdenados = [...itens].sort((a, b) => {
    const va = valorOrdenavel(a, campoAtivo);
    const vb = valorOrdenavel(b, campoAtivo);
    if (va < vb) return direcao === "asc" ? -1 : 1;
    if (va > vb) return direcao === "asc" ? 1 : -1;
    return 0;
  });

  function hrefOrdenar(campo: string) {
    const novaDirecao = campoAtivo === campo && direcao === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    params.set("ordenar", campo);
    params.set("dir", novaDirecao);
    return `/pedidos?${params.toString()}`;
  }

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
        <thead className="bg-painel">
          <tr>
            {COLUNAS_ORDENAVEIS.map((c) => (
              <th key={c.campo} className="whitespace-nowrap px-4 py-3 font-bold text-terracota-vibrante">
                <Link href={hrefOrdenar(c.campo)} className="flex items-center gap-1 hover:underline">
                  {c.rotulo}
                  {campoAtivo === c.campo && <span>{direcao === "asc" ? "▲" : "▼"}</span>}
                </Link>
              </th>
            ))}
            <th className="whitespace-nowrap px-4 py-3 font-bold text-terracota-vibrante"></th>
          </tr>
        </thead>
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={8} texto="Nenhum pedido cadastrado." />}
          {itensOrdenados.map((p) => (
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
