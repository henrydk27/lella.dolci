import Link from "next/link";
import * as ingredientes from "@/lib/ingredientes";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

export default async function IngredientesPage() {
  const itens = await ingredientes.listarIngredientes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Ingredientes</h2>
        <Link href="/ingredientes/novo">
          <Botao>+ Novo ingrediente</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Nome", "Unidade", "Estoque", "Preço unit.", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={5} texto="Nenhum ingrediente cadastrado." />}
          {itens.map((i) => (
            <TabelaLinha key={i.id}>
              <TabelaCelula>{i.nome}</TabelaCelula>
              <TabelaCelula>{i.unidade}</TabelaCelula>
              <TabelaCelula>{i.quantidadeEstoque}</TabelaCelula>
              <TabelaCelula>R$ {i.precoUnitario.toFixed(2)}</TabelaCelula>
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
