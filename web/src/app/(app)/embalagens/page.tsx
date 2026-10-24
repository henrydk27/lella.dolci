import Link from "next/link";
import * as embalagens from "@/lib/embalagens";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

export default async function EmbalagensPage() {
  const itens = await embalagens.listarEmbalagens();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Embalagens</h2>
        <Link href="/embalagens/novo">
          <Botao>+ Nova embalagem</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Nome", "Categoria", "Custo total", "Rendimento", "Custo unit.", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhuma embalagem cadastrada." />}
          {itens.map((e) => (
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
