import * as produtos from "@/lib/produtos";
import * as clientes from "@/lib/clientes";
import { Cartao } from "@/components/ui/Cartao";
import { NovoPedidoForm } from "./NovoPedidoForm";

export default async function NovoPedidoPage() {
  const listaProdutos = await produtos.listarProdutos();
  const listaClientes = await clientes.listarClientes();

  return (
    <Cartao titulo="Novo pedido" className="max-w-xl">
      <NovoPedidoForm
        produtos={listaProdutos.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, estoqueProduzido: p.estoqueProduzido }))}
        nomesClientes={listaClientes.map((c) => c.nome)}
      />
    </Cartao>
  );
}
