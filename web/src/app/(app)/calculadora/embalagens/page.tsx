import Link from "next/link";
import * as embalagensLib from "@/lib/embalagens";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";

export default async function CalculadoraEmbalagensPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todas = await embalagensLib.listarEmbalagens();
  const itens = todas.filter((e) => correspondeBusca(buscar ?? "", e.nome, e.categoria));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Embalagens</h2>
          <p className="text-sm text-texto-suave">
            Consulta rápida — para editar uma embalagem, use a tela{" "}
            <Link href="/embalagens" className="font-bold text-terracota hover:underline">
              Embalagens
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
        <TabelaCabecalho colunas={["Nome", "Categoria", "Custo total", "Rendimento", "Custo por unidade"]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={5} texto="Nenhuma embalagem encontrada." />}
          {itens.map((e) => (
            <TabelaLinha key={e.id}>
              <TabelaCelula>{e.nome}</TabelaCelula>
              <TabelaCelula>{e.categoria ?? "-"}</TabelaCelula>
              <TabelaCelula>R$ {e.custoTotal.toFixed(2)}</TabelaCelula>
              <TabelaCelula>{e.rendimento}</TabelaCelula>
              <TabelaCelula>R$ {embalagensLib.calcularCustoUnitario(e).toFixed(4)}</TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
