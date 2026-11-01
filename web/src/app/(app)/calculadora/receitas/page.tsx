import Link from "next/link";
import * as produtosLib from "@/lib/produtos";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

export default async function CalculadoraReceitasPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todosProdutos = await produtosLib.listarProdutos();
  const filtrados = todosProdutos.filter((p) => correspondeBusca(buscar ?? "", p.nome, p.categoria));

  const receitas = await Promise.all(
    filtrados.map(async (produto) => {
      const detalhe = await produtosLib.detalharCustoProduto(produto.id);
      const margem = await produtosLib.calcularMargemProduto(produto.id, produto.preco);
      return { produto, detalhe, margem };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Receitas prontas</h2>
          <p className="text-sm text-texto-suave">
            Custo e margem de todos os produtos já cadastrados. Para editar a receita de um produto, use a tela{" "}
            <Link href="/produtos" className="font-bold text-terracota hover:underline">
              Produtos
            </Link>
            .
          </p>
        </div>
        <Link href="/calculadora" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar por nome ou categoria" />

      <Tabela>
        <TabelaCabecalho
          colunas={["Produto", "Ingredientes", "Utilidades", "Embalagem", "Custo total", "Preço de venda", "Margem"]}
        />
        <tbody>
          {receitas.length === 0 && <TabelaVazia colunas={7} texto="Nenhum produto encontrado." />}
          {receitas.map(({ produto, detalhe, margem }) => (
            <TabelaLinha key={produto.id}>
              <TabelaCelula>
                <Link href={`/produtos/${produto.id}`} className="font-bold text-terracota hover:underline">
                  {produto.nome}
                </Link>
              </TabelaCelula>
              <TabelaCelula>R$ {detalhe.ingredientes.toFixed(2)}</TabelaCelula>
              <TabelaCelula>R$ {detalhe.overhead.toFixed(2)}</TabelaCelula>
              <TabelaCelula>R$ {detalhe.embalagens.toFixed(2)}</TabelaCelula>
              <TabelaCelula>R$ {detalhe.total.toFixed(2)}</TabelaCelula>
              <TabelaCelula>R$ {produto.preco.toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                <span className={margem.margemReais >= 0 ? "font-bold text-salvia" : "font-bold text-alerta"}>
                  R$ {margem.margemReais.toFixed(2)} ({margem.margemPercentual.toFixed(1)}%)
                </span>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
