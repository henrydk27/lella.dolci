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
        <TabelaCabecalho colunas={["Nome", "Estoque", "Peso (g)", "Preço da embalagem", "Preço/g", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhum ingrediente cadastrado." />}
          {itens.map((i) => (
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
