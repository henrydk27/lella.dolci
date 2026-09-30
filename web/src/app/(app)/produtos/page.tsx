import Link from "next/link";
import * as produtos from "@/lib/produtos";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

export default async function ProdutosPage() {
  const itens = await produtos.listarProdutos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Produtos</h2>
        <Link href="/produtos/novo">
          <Botao>+ Novo produto</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Nome", "Categoria", "Preço", "Estoque pronto", "Descrição", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhum produto cadastrado." />}
          {itens.map((p) => (
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
