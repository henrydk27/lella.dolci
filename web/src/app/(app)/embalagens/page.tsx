import Link from "next/link";
import * as embalagens from "@/lib/embalagens";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";

type Embalagem = Awaited<ReturnType<typeof embalagens.listarEmbalagens>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "categoria", rotulo: "Categoria" },
  { campo: "custoTotal", rotulo: "Custo total" },
  { campo: "rendimento", rotulo: "Rendimento" },
  { campo: "custoUnitario", rotulo: "Custo unit." },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function valorOrdenavel(e: Embalagem, campo: string): string | number {
  switch (campo) {
    case "nome":
      return e.nome.toLowerCase();
    case "categoria":
      return (e.categoria ?? "").toLowerCase();
    case "custoTotal":
      return e.custoTotal;
    case "rendimento":
      return e.rendimento;
    case "custoUnitario":
      return embalagens.calcularCustoUnitario(e);
    default:
      return "";
  }
}

export default async function EmbalagensPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenar?: string; dir?: string }>;
}) {
  const { ordenar, dir } = await searchParams;
  const itens = await embalagens.listarEmbalagens();

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "nome", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, valorOrdenavel);
  const hrefOrdenar = (campo: string) => gerarHrefOrdenar("/embalagens", {}, campo, campoAtivo, direcao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Embalagens</h2>
        <Link href="/embalagens/novo">
          <Botao>+ Nova embalagem</Botao>
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
          {itensOrdenados.length === 0 && <TabelaVazia colunas={6} texto="Nenhuma embalagem cadastrada." />}
          {itensOrdenados.map((e) => (
            <TabelaLinha key={e.id}>
              <TabelaCelula>{e.nome}</TabelaCelula>
              <TabelaCelula>{e.categoria ?? "-"}</TabelaCelula>
              <TabelaCelula>R$ {e.custoTotal.toFixed(2)}</TabelaCelula>
              <TabelaCelula>{e.rendimento}</TabelaCelula>
              <TabelaCelula>R$ {embalagens.calcularCustoUnitario(e).toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/embalagens/${e.id}`} className="font-bold text-terracota hover:underline">
                  Editar
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
