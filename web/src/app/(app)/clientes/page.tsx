import Link from "next/link";
import * as clientes from "@/lib/clientes";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { Botao } from "@/components/ui/Botao";

const CORES_STATUS: Record<string, string> = {
  novo: "text-salvia",
  recorrente: "text-terracota-vibrante",
  vip: "text-terracota",
  inativo: "text-alerta",
};

export default async function ClientesPage() {
  const itens = await clientes.listarClientesComStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-terracota-vibrante">Clientes</h2>
        <Link href="/clientes/novo">
          <Botao>+ Novo cliente</Botao>
        </Link>
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Nome", "Status", "Total gasto", "Última compra", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={5} texto="Nenhum cliente cadastrado." />}
          {itens.map((info) => (
            <TabelaLinha key={info.cliente.id}>
              <TabelaCelula>{info.cliente.nome}</TabelaCelula>
              <TabelaCelula>
                <span className={`font-bold ${CORES_STATUS[info.status]}`}>{info.status}</span>
              </TabelaCelula>
              <TabelaCelula>R$ {info.totalGasto.toFixed(2)}</TabelaCelula>
              <TabelaCelula>
                {info.ultimaCompra ? info.ultimaCompra.slice(0, 10).split("-").reverse().join("/") : "-"}
              </TabelaCelula>
              <TabelaCelula>
                <Link href={`/clientes/${info.cliente.id}`} className="font-bold text-terracota hover:underline">
                  Ver
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </tbody>
      </Tabela>
    </div>
  );
}
