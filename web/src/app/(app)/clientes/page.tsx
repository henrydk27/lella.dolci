import Link from "next/link";
import * as clientes from "@/lib/clientes";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

const CORES_STATUS: Record<string, string> = {
  novo: "text-salvia",
  recorrente: "text-terracota-vibrante",
  vip: "text-terracota",
  inativo: "text-alerta",
};

type ClienteComStatus = Awaited<ReturnType<typeof clientes.listarClientesComStatus>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "status", rotulo: "Status" },
  { campo: "totalGasto", rotulo: "Total gasto" },
  { campo: "ultimaCompra", rotulo: "Última compra" },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function valorOrdenavel(info: ClienteComStatus, campo: string): string | number {
  switch (campo) {
    case "nome":
      return info.cliente.nome.toLowerCase();
    case "status":
      return info.status;
    case "totalGasto":
      return info.totalGasto;
    case "ultimaCompra":
      return info.ultimaCompra ?? "";
    default:
      return "";
  }
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenar?: string; dir?: string; buscar?: string }>;
}) {
  const { ordenar, dir, buscar } = await searchParams;
  const todos = await clientes.listarClientesComStatus();
  const itens = todos.filter((info) => correspondeBusca(buscar ?? "", info.cliente.nome, info.status));

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "nome", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, valorOrdenavel);
  const hrefOrdenar = (campo: string) => gerarHrefOrdenar("/clientes", { buscar }, campo, campoAtivo, direcao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Clientes</h2>
        <Link href="/clientes/novo">
          <Botao>+ Novo cliente</Botao>
        </Link>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar por nome ou status" camposOcultos={{ ordenar, dir }} />

      <Tabela>
        <TabelaCabecalhoOrdenavel
          colunas={COLUNAS_ORDENAVEIS}
          campoAtivo={campoAtivo}
          direcao={direcao}
          gerarHref={hrefOrdenar}
          extras={[""]}
        />
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={5} texto="Nenhum cliente cadastrado." />}
          {itensOrdenados.map((info) => (
            <TabelaLinha key={info.cliente.id}>
              <TabelaCelula>{info.cliente.nome}</TabelaCelula>
              <TabelaCelula>
                <span className={`font-bold ${CORES_STATUS[info.status]}`}>{info.status}</span>
              </TabelaCelula>
              <TabelaCelula>R$ {info.totalGasto.toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                {info.ultimaCompra ? info.ultimaCompra.slice(0, 10).split("-").reverse().join("/") : "-"}
              </TabelaCelula>
              <TabelaCelula>
                <Link href={`/clientes/${info.cliente.id}`} className="font-bold text-terracota hover:underline">
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
