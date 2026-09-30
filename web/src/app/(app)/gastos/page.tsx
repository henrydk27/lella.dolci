import Link from "next/link";
import * as gastos from "@/lib/gastos";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";

export default async function GastosPage() {
  const itens = await gastos.listarGastos();
  const total = await gastos.totalGastos();
  const porCategoria = await gastos.resumoPorCategoria();
  const porTipo = await gastos.resumoPorTipoPagamento();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Gastos</h2>
        <Link href="/gastos/novo">
          <Botao>+ Novo gasto</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Nome", "Data", "Pagamento", "Categoria", "Valor", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhum gasto cadastrado." />}
          {itens.map((g) => (
            <TabelaLinha key={g.id}>
              <TabelaCelula>{g.nome}</TabelaCelula>
              <TabelaCelula>{g.data.split("-").reverse().join("/")}</TabelaCelula>
              <TabelaCelula>{g.tipoPagamento ?? "-"}</TabelaCelula>
              <TabelaCelula>{g.categoria ?? "-"}</TabelaCelula>
              <TabelaCelula>R$ {g.valor.toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                <Link href={`/gastos/${g.id}`} className="font-bold text-terracota hover:underline">
                  Editar
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao titulo={`Total: R$ ${total.toFixed(2)}`}>
          <p className="mb-2 text-sm font-bold text-terracota-vibrante">Por categoria</p>
          <ul className="space-y-1 text-sm">
            {porCategoria.map(([cat, valor]) => (
              <li key={cat}>
                {cat}: R$ {valor.toFixed(2)}
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao titulo="Por forma de pagamento">
          <ul className="space-y-1 text-sm">
            {porTipo.map(([tipo, valor]) => (
              <li key={tipo}>
                {tipo}: R$ {valor.toFixed(2)}
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
    </div>
  );
}
