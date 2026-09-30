import { Cartao } from "@/components/ui/Cartao";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import * as pedidos from "@/lib/pedidos";
import * as clientes from "@/lib/clientes";

function CartaoIndicador({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <Cartao titulo={titulo}>
      <p className="font-titulo text-2xl text-texto">{valor}</p>
      <p className="mt-1 text-sm text-texto-suave">{detalhe}</p>
    </Cartao>
  );
}

const ROTULOS_TIPO: Record<string, string> = {
  encomenda: "Encomendas",
  pronta_entrega: "Pronta entrega",
};

export default async function DashboardPage() {
  const resumoMes = await pedidos.resumoMesAtual();
  const emAberto = await pedidos.quantidadePedidosEmAberto();
  const maisVendido = await pedidos.produtoMaisVendido();
  const resumoPorTipo = await pedidos.resumoPorTipoMesAtual();

  const aniversariantes = await clientes.aniversariantesDoMes();
  const inativos = await clientes.clientesInativos();
  const anoAtual = String(new Date().getFullYear());
  const inicioMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const clienteTop = await clientes.clienteMaiorGasto(inicioMes);

  const categorias = await pedidos.vendasPorCategoria(anoAtual);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 font-titulo text-xl text-terracota-vibrante">Resumo geral</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CartaoIndicador
            titulo="Vendido este mês"
            valor={`R$ ${resumoMes.totalVendas.toFixed(2)}`}
            detalhe={`${resumoMes.quantidadePedidos} pedido(s) pago(s)`}
          />
          <CartaoIndicador titulo="Pedidos em aberto" valor={String(emAberto)} detalhe="aguardando pagamento" />
          <CartaoIndicador
            titulo="Produto mais vendido"
            valor={maisVendido?.nome ?? "-"}
            detalhe={maisVendido ? `${maisVendido.totalVendido} unidade(s) vendida(s)` : "sem vendas ainda"}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-titulo text-xl text-terracota-vibrante">Vendido este mês por tipo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pedidos.TIPOS_PEDIDO.map((t) => (
            <CartaoIndicador
              key={t}
              titulo={ROTULOS_TIPO[t] ?? t}
              valor={`R$ ${resumoPorTipo[t].totalVendas.toFixed(2)}`}
              detalhe={`${resumoPorTipo[t].quantidadePedidos} pedido(s) pago(s)`}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-titulo text-xl text-terracota-vibrante">Relacionamento com clientes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CartaoIndicador
            titulo="Aniversariantes do mês"
            valor={String(aniversariantes.length)}
            detalhe={aniversariantes.slice(0, 3).map((c) => c.nome).join(", ") || "nenhum este mês"}
          />
          <CartaoIndicador
            titulo="Clientes inativos"
            valor={String(inativos.length)}
            detalhe={`sem comprar há mais de ${clientes.DIAS_INATIVIDADE} dias`}
          />
          <CartaoIndicador
            titulo="Cliente que mais gastou (mês)"
            valor={clienteTop?.nome ?? "-"}
            detalhe={clienteTop ? `R$ ${clienteTop.totalGasto.toFixed(2)} gastos este mês` : "sem vendas este mês"}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-titulo text-xl text-terracota-vibrante">Vendas por categoria (ano atual)</h2>
        <Tabela>
          <TabelaCabecalho colunas={["Categoria", "Quantidade vendida"]} />
          <tbody>
            {categorias.length === 0 && <TabelaVazia colunas={2} texto="Nenhuma venda registrada ainda." />}
            {categorias.map((c) => (
              <TabelaLinha key={c.categoria}>
                <TabelaCelula>{c.categoria}</TabelaCelula>
                <TabelaCelula>{c.total}</TabelaCelula>
              </TabelaLinha>
            ))}
          </tbody>
        </Tabela>
      </div>
    </div>
  );
}
