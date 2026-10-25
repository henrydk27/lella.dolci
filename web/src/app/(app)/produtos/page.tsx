import Link from "next/link";
import * as produtos from "@/lib/produtos";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

type Produto = Awaited<ReturnType<typeof produtos.listarProdutos>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "categoria", rotulo: "Categoria" },
  { campo: "preco", rotulo: "Preço" },
  { campo: "estoque", rotulo: "Estoque pronto" },
  { campo: "descricao", rotulo: "Descrição" },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function valorOrdenavel(p: Produto, campo: string): string | number {
  switch (campo) {
    case "nome":
      return p.nome.toLowerCase();
    case "categoria":
      return (p.categoria ?? "").toLowerCase();
    case "preco":
      return p.preco;
    case "estoque":
      return p.estoqueProduzido;
    case "descricao":
      return (p.descricao ?? "").toLowerCase();
    default:
      return "";
  }
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenar?: string; dir?: string; buscar?: string }>;
}) {
  const { ordenar, dir, buscar } = await searchParams;
  const todos = await produtos.listarProdutos();
  const itens = todos.filter((p) => correspondeBusca(buscar ?? "", p.nome, p.categoria, p.descricao));

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "nome", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, valorOrdenavel);
  const hrefOrdenar = (campo: string) => gerarHrefOrdenar("/produtos", { buscar }, campo, campoAtivo, direcao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Produtos</h2>
        <Link href="/produtos/novo">
          <Botao>+ Novo produto</Botao>
        </Link>
      </div>

      <BarraBusca
        buscar={buscar}
        placeholder="Buscar por nome, categoria ou descrição"
        camposOcultos={{ ordenar, dir }}
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
          {itensOrdenados.length === 0 && <TabelaVazia colunas={6} texto="Nenhum produto cadastrado." />}
          {itensOrdenados.map((p) => (
            <TabelaLinha key={p.id}>
              <TabelaCelula>{p.nome}</TabelaCelula>
              <TabelaCelula>{p.categoria ?? "-"}</TabelaCelula>
              <TabelaCelula>R$ {p.preco.toFixed(2)}</TabelaCelula>
              <TabelaCelula>{p.estoqueProduzido}</TabelaCelula>
              <TabelaCelula>{p.descricao ?? ""}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/produtos/${p.id}`} className="font-bold text-terracota hover:underline">
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
