import Link from "next/link";
import * as clientes from "@/lib/clientes";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

const CORES_BADGE_STATUS: Record<string, string> = {
  novo: "bg-salvia/15 text-salvia",
  recorrente: "bg-terracota-vibrante/15 text-terracota-vibrante",
  vip: "bg-terracota/15 text-terracota",
  inativo: "bg-alerta/15 text-alerta",
};

type ClienteComStatus = Awaited<ReturnType<typeof clientes.listarClientesComStatus>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "status", rotulo: "Status" },
  { campo: "totalGasto", rotulo: "Total gasto" },
  { campo: "pendente", rotulo: "Pendente" },
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
    case "pendente":
      return info.pendente;
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

  const contagemPorStatus = todos.reduce(
    (contagem, info) => {
      contagem[info.status] = (contagem[info.status] ?? 0) + 1;
      return contagem;
    },
    { novo: 0, recorrente: 0, vip: 0, inativo: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Clientes</h2>
        <div className="flex gap-2">
          <Link href="/clientes/mesclar">
            <Botao variante="fantasma">Mesclar duplicados</Botao>
          </Link>
          <Link href="/clientes/novo">
            <Botao>+ Novo cliente</Botao>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Cartao titulo="Total de clientes">
          <p className="font-titulo text-2xl text-texto">{todos.length}</p>
        </Cartao>
        <Cartao titulo="VIP">
          <p className="font-titulo text-2xl text-terracota">{contagemPorStatus.vip}</p>
        </Cartao>
        <Cartao titulo="Recorrentes">
          <p className="font-titulo text-2xl text-terracota-vibrante">{contagemPorStatus.recorrente}</p>
        </Cartao>
        <Cartao titulo="Inativos">
          <p className="font-titulo text-2xl text-alerta">{contagemPorStatus.inativo}</p>
        </Cartao>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar por nome ou status" camposOcultos={{ ordenar, dir }} />

      <Tabela>
        <TabelaCabecalhoOrdenavel
          colunas={COLUNAS_ORDENAVEIS}
          campoAtivo={campoAtivo}
          direcao={direcao}
          gerarHref={hrefOrdenar}
          extras={["Telefone", ""]}
        />
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={7} texto="Nenhum cliente cadastrado." />}
          {itensOrdenados.map((info) => (
            <TabelaLinha key={info.cliente.id}>
              <TabelaCelula>{info.cliente.nome}</TabelaCelula>
              <TabelaCelula>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${CORES_BADGE_STATUS[info.status]}`}
                >
                  {info.status}
                </span>
              </TabelaCelula>
              <TabelaCelula>R$ {info.totalGasto.toFixed(2)}</TabelaCelula>
              <TabelaCelula className={info.pendente > 0 ? "font-bold text-alerta" : ""}>
                R$ {info.pendente.toFixed(2)}
              </TabelaCelula>
              <TabelaCelula>
                {info.ultimaCompra ? info.ultimaCompra.slice(0, 10).split("-").reverse().join("/") : "-"}
              </TabelaCelula>
              <TabelaCelula>{info.cliente.telefone ?? "-"}</TabelaCelula>
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
