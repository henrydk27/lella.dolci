import Link from "next/link";
import * as ingredientes from "@/lib/ingredientes";
import { Tabela, TabelaCabecalhoOrdenavel, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { configurarOrdenacao, ordenarLista, gerarHrefOrdenar } from "@/lib/ordenacao";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

type Ingrediente = Awaited<ReturnType<typeof ingredientes.listarIngredientes>>[number];

const COLUNAS_ORDENAVEIS: { campo: string; rotulo: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "estoque", rotulo: "Estoque" },
  { campo: "peso", rotulo: "Peso (g)" },
  { campo: "precoEmbalagem", rotulo: "Preço da embalagem" },
  { campo: "precoUnitario", rotulo: "Preço/g" },
];
const CAMPOS_VALIDOS = COLUNAS_ORDENAVEIS.map((c) => c.campo);

function valorOrdenavel(i: Ingrediente, campo: string): string | number {
  switch (campo) {
    case "nome":
      return i.nome.toLowerCase();
    case "estoque":
      return i.quantidadeEstoque;
    case "peso":
      return i.gramasPorEmbalagem;
    case "precoEmbalagem":
      return i.precoEmbalagem;
    case "precoUnitario":
      return i.precoUnitario;
    default:
      return "";
  }
}

export default async function IngredientesPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenar?: string; dir?: string; buscar?: string }>;
}) {
  const { ordenar, dir, buscar } = await searchParams;
  const todos = await ingredientes.listarIngredientes();
  const itens = todos.filter((i) => correspondeBusca(buscar ?? "", i.nome));

  const { campoAtivo, direcao } = configurarOrdenacao(ordenar, dir, "nome", CAMPOS_VALIDOS);
  const itensOrdenados = ordenarLista(itens, campoAtivo, direcao, valorOrdenavel);
  const hrefOrdenar = (campo: string) => gerarHrefOrdenar("/ingredientes", { buscar }, campo, campoAtivo, direcao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Ingredientes</h2>
        <Link href="/ingredientes/novo">
          <Botao>+ Novo ingrediente</Botao>
        </Link>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar por nome" camposOcultos={{ ordenar, dir }} />

      <Tabela>
        <TabelaCabecalhoOrdenavel
          colunas={COLUNAS_ORDENAVEIS}
          campoAtivo={campoAtivo}
          direcao={direcao}
          gerarHref={hrefOrdenar}
          extras={[""]}
        />
        <tbody>
          {itensOrdenados.length === 0 && <TabelaVazia colunas={6} texto="Nenhum ingrediente cadastrado." />}
          {itensOrdenados.map((i) => (
            <TabelaLinha key={i.id}>
              <TabelaCelula>{i.nome}</TabelaCelula>
              <TabelaCelula>{i.quantidadeEstoque}</TabelaCelula>
              <TabelaCelula>{i.gramasPorEmbalagem > 0 ? i.gramasPorEmbalagem : "-"}</TabelaCelula>
              <TabelaCelula>{i.gramasPorEmbalagem > 0 ? `R$ ${i.precoEmbalagem.toFixed(2)}` : "-"}</TabelaCelula>
              <TabelaCelula>R$ {i.precoUnitario.toFixed(4)}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/ingredientes/${i.id}`} className="font-bold text-terracota hover:underline">
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
