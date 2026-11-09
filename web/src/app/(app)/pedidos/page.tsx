import Link from "next/link";
import * as pedidos from "@/lib/pedidos";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";
import { SeletorStatusInline } from "@/components/ui/CampoInlineForm";
import { atualizarStatusPedidoRapido } from "./actions";
import { STATUS_PEDIDO } from "@/lib/pedidos";

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
  { campo: "pendente", rotulo: "Pendente" },
  { campo: "status", rotulo: "Status" },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function criarValorOrdenavel(pendentes: Map<number, number>) {
  return function valorOrdenavel(p: Pedido, campo: string): string | number {
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
      case "pendente":
        return pendentes.get(p.id) ?? 0;
      case "status":
        return p.status;
      default:
        return "";
    }
  };
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; ordenar?: string; dir?: string; buscar?: string }>;
}) {
  const { tipo, ordenar, dir, buscar } = await searchParams;
  const todos = await pedidos.listarPedidos();
  const pendentes = await pedidos.mapaPendentePorPedido();
  const filtradosPorTipo = tipo ? todos.filter((p) => p.tipo === tipo) : todos;
  const itens = filtradosPorTipo.filter((p) =>
    correspondeBusca(buscar ?? "", String(p.id), p.clienteNome, ROTULOS_TIPO[p.tipo] ?? p.tipo, p.status)
  );

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "data", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, criarValorOrdenavel(pendentes));
  const hrefOrdenar = (campo: string) =>
    gerarHrefOrdenar("/pedidos", { tipo, buscar }, campo, campoAtivo, direcao);

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

      <BarraBusca
        buscar={buscar}
        placeholder="Buscar por cliente, tipo ou status"
        camposOcultos={{ tipo, ordenar, dir }}
      />

      <Tabela>
        <TabelaCabecalhoOrdenavel
          colunas={COLUNAS_ORDENAVEIS}
          campoAtivo={campoAtivo}
          direcao={direcao}
          gerarHref={hrefOrdenar}
          extras={[""]}
        />
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={8} texto="Nenhum pedido cadastrado." />}
          {itensOrdenados.map((p) => (
            <TabelaLinha key={p.id}>
              <TabelaCelula>#{p.id}</TabelaCelula>
              <TabelaCelula>{p.clienteNome ?? "-"}</TabelaCelula>
              <TabelaCelula>{ROTULOS_TIPO[p.tipo] ?? p.tipo}</TabelaCelula>
              <TabelaCelula>{dataBr(p.dataPedido)}</TabelaCelula>
              <TabelaCelula>{p.dataEntrega ? p.dataEntrega.split("-").reverse().join("/") : "-"}</TabelaCelula>
              <TabelaCelula className={(pendentes.get(p.id) ?? 0) > 0.009 ? "font-bold text-alerta" : ""}>
                R$ {(pendentes.get(p.id) ?? 0).toFixed(2)}
              </TabelaCelula>
              <TabelaCelula>
                <SeletorStatusInline
                  valorInicial={p.status}
                  opcoes={STATUS_PEDIDO.map((s) => ({ valor: s, texto: s }))}
                  action={atualizarStatusPedidoRapido.bind(null, p.id)}
                />
              </TabelaCelula>
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
