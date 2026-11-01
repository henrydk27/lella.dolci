import Link from "next/link";
import * as ingredientesLib from "@/lib/ingredientes";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

export default async function CalculadoraIngredientesPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todos = await ingredientesLib.listarIngredientes();
  const itens = todos.filter((i) => correspondeBusca(buscar ?? "", i.nome));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Custo dos ingredientes</h2>
          <p className="text-sm text-texto-suave">
            Consulta rápida — para editar um ingrediente, use a tela{" "}
            <Link href="/ingredientes" className="font-bold text-terracota hover:underline">
              Ingredientes
            </Link>
            .
          </p>
        </div>
        <Link href="/calculadora" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar ingrediente" />

      <Tabela>
        <TabelaCabecalho colunas={["Ingrediente", "Peso da embalagem fechada", "Custo da embalagem", "Custo por grama"]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={4} texto="Nenhum ingrediente encontrado." />}
          {itens.map((i) => (
            <TabelaLinha key={i.id}>
              <TabelaCelula>{i.nome}</TabelaCelula>
              <TabelaCelula>{i.gramasPorEmbalagem} g</TabelaCelula>
              <TabelaCelula>R$ {i.precoEmbalagem.toFixed(2)}</TabelaCelula>
              <TabelaCelula>R$ {i.precoUnitario.toFixed(4)}</TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
