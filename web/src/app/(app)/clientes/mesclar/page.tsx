import Link from "next/link";
import * as clientes from "@/lib/clientes";
import { MesclarClientesForm } from "./MesclarClientesForm";

export default async function MesclarClientesPage() {
  const todos = await clientes.listarClientesComStatus();
  const dados = todos.map((info) => ({
    id: info.cliente.id,
    nome: info.cliente.nome,
    telefone: info.cliente.telefone,
    email: info.cliente.email,
    endereco: info.cliente.endereco,
    notas: info.cliente.notas,
    totalGasto: info.totalGasto,
    quantidadePedidos: info.quantidadePedidos,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Mesclar clientes duplicados</h2>
          <p className="text-sm text-texto-suave">
            Selecione dois ou mais cadastros que são a mesma pessoa para juntá-los em um só.
          </p>
        </div>
        <Link href="/clientes" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <MesclarClientesForm clientes={dados} />
    </div>
  );
}
