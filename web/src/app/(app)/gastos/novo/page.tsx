import * as gastos from "@/lib/gastos";
import { criarGasto } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovoGastoPage() {
  return (
    <Cartao titulo="Novo gasto" className="max-w-lg">
      <form action={criarGasto} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Compra de farinha" required />
        <Campo rotulo="Data" name="data" type="date" required />
        <CampoSelect
          rotulo="Forma de pagamento"
          name="tipoPagamento"
          opcoes={[{ valor: "", texto: "-" }, ...gastos.TIPOS_PAGAMENTO.map((t) => ({ valor: t, texto: t }))]}
        />
        <CampoSelect
          rotulo="Categoria"
          name="categoria"
          opcoes={[{ valor: "", texto: "-" }, ...gastos.CATEGORIAS.map((c) => ({ valor: c, texto: c }))]}
        />
        <Campo rotulo="Valor" name="valor" type="number" step="any" required />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
