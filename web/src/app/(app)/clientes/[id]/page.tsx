import { notFound } from "next/navigation";
import * as clientes from "@/lib/clientes";
import * as pedidos from "@/lib/pedidos";
import { atualizarCliente, removerCliente } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";

const CORES_STATUS: Record<string, string> = {
  novo: "text-salvia",
  recorrente: "text-terracota-vibrante",
  vip: "text-terracota",
  inativo: "text-alerta",
};

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await clientes.perfilCliente(Number(id));
  if (!perfil) notFound();
  const { cliente } = perfil;

  const historico = await clientes.historicoPedidosCliente(cliente.id);
  const totaisItens = await pedidos.totaisPorPedidoIds(historico.map((p) => p.id));
  const historicoComTotal = historico.map((p) => ({
    ...p,
    total: (totaisItens.get(p.id) ?? 0) + p.taxaEntrega,
  }));

  const salvar = atualizarCliente.bind(null, cliente.id);
  const remover = removerCliente.bind(null, cliente.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Cartao titulo="Dados do cliente">
        <form action={salvar} className="space-y-4">
          <Campo rotulo="Nome" name="nome" defaultValue={cliente.nome} required />
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Telefone" name="telefone" defaultValue={cliente.telefone ?? ""} />
            <Campo rotulo="Aniversário" name="aniversario" defaultValue={cliente.aniversario ?? ""} placeholder="DD/MM" />
          </div>
          <Campo rotulo="E-mail" name="email" type="email" defaultValue={cliente.email ?? ""} />
          <Campo rotulo="Endereço" name="endereco" defaultValue={cliente.endereco ?? ""} />
          <Campo rotulo="Como conheceu a loja" name="comoConheceu" defaultValue={cliente.comoConheceu ?? ""} />
          <CampoArea rotulo="Notas" name="notas" defaultValue={cliente.notas ?? ""} rows={3} />
          <Botao type="submit">Salvar</Botao>
        </form>
        <form action={remover} className="mt-3">
          <Botao type="submit" perigo>
            Remover cliente
          </Botao>
        </form>
      </Cartao>

      <div className="space-y-6">
        <Cartao titulo="Resumo">
          <p className={`mb-2 font-bold uppercase ${CORES_STATUS[perfil.status]}`}>{perfil.status}</p>
          <p className="text-sm text-texto">
            Total gasto: <strong>R$ {perfil.totalGasto.toFixed(2)}</strong> · Pedidos pagos:{" "}
            <strong>{perfil.quantidadePedidos}</strong>
          </p>
          <p className="text-sm text-texto">
            Ticket médio: <strong>R$ {perfil.ticketMedio.toFixed(2)}</strong>
          </p>
          <p className="text-sm text-texto">
            Última compra:{" "}
            <strong>{perfil.ultimaCompra ? perfil.ultimaCompra.slice(0, 10).split("-").reverse().join("/") : "-"}</strong>
          </p>
          <p className="text-sm text-texto">
            Produto favorito: <strong>{perfil.produtoFavorito ?? "-"}</strong>
          </p>
        </Cartao>

        <Cartao titulo="Histórico de pedidos">
          <Tabela>
            <TabelaCabecalho colunas={["ID", "Data", "Status", "Total"]} />
            <tbody>
              {historicoComTotal.length === 0 && <TabelaVazia colunas={4} texto="Nenhum pedido ainda." />}
              {historicoComTotal.map((p) => (
                <TabelaLinha key={p.id}>
                  <TabelaCelula>#{p.id}</TabelaCelula>
                  <TabelaCelula>{p.dataPedido.slice(0, 10).split("-").reverse().join("/")}</TabelaCelula>
                  <TabelaCelula>{p.status}</TabelaCelula>
                  <TabelaCelula>R$ {p.total.toFixed(2)}</TabelaCelula>
                </TabelaLinha>
              ))}
            </tbody>
          </Tabela>
        </Cartao>
      </div>
    </div>
  );
}
