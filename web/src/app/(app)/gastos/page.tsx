import Link from "next/link";
import * as gastos from "@/lib/gastos";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";

type Gasto = Awaited<ReturnType<typeof gastos.listarGastos>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "data", rotulo: "Data" },
  { campo: "pagamento", rotulo: "Pagamento" },
  { campo: "categoria", rotulo: "Categoria" },
  { campo: "valor", rotulo: "Valor" },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function valorOrdenavel(g: Gasto, campo: string): string | number {
  switch (campo) {
    case "nome":
      return g.nome.toLowerCase();
    case "data":
      return g.data;
    case "pagamento":
      return (g.tipoPagamento ?? "").toLowerCase();
    case "categoria":
      return (g.categoria ?? "").toLowerCase();
    case "valor":
      return g.valor;
    default:
      return "";
  }
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenar?: string; dir?: string }>;
}) {
  const { ordenar, dir } = await searchParams;
  const itens = await gastos.listarGastos();
  const total = await gastos.totalGastos();
  const porCategoria = await gastos.resumoPorCategoria();
  const porTipo = await gastos.resumoPorTipoPagamento();

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "data", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, valorOrdenavel);
  const hrefOrdenar = (campo: string) => gerarHrefOrdenar("/gastos", {}, campo, campoAtivo, direcao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Gastos</h2>
        <Link href="/gastos/novo">
          <Botao>+ Novo gasto</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalhoOrdenavel
          colunas={COLUNAS_ORDENAVEIS}
          campoAtivo={campoAtivo}
          direcao={direcao}
          gerarHref={hrefOrdenar}
          extras={[""]}
        />
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={6} texto="Nenhum gasto cadastrado." />}
          {itensOrdenados.map((g) => (
            <TabelaLinha key={g.id}>
              <TabelaCelula>{g.nome}</TabelaCelula>
              <TabelaCelula>{g.data.split("-").reverse().join("/")}</TabelaCelula>
              <TabelaCelula>{g.tipoPagamento ?? "-"}</TabelaCelula>
              <TabelaCelula>{g.categoria ?? "-"}</TabelaCelula>
              <TabelaCelula>R$ {g.valor.toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/gastos/${g.id}`} className="font-bold text-terracota hover:underline">
                  Editar
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao titulo={`Total: R$ ${total.toFixed(2)}`}>
          <p className="mb-2 text-sm font-bold text-terracota-vibrante">Por categoria</p>
          <ul className="space-y-1 text-sm">
            {porCategoria.map(([cat, valor]) => (
              <li key={cat}>
                {cat}: R$ {valor.toFixed(2)}
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao titulo="Por forma de pagamento">
          <ul className="space-y-1 text-sm">
            {porTipo.map(([tipo, valor]) => (
              <li key={tipo}>
                {tipo}: R$ {valor.toFixed(2)}
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
    </div>
  );
}
