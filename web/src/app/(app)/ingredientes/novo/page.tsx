import { criarIngrediente } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovoIngredientePage() {
  return (
    <Cartao titulo="Novo ingrediente" className="max-w-lg">
      <form action={criarIngrediente} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Farinha de trigo" required />
        <Campo rotulo="Unidade (g, kg, ml, l, un)" name="unidade" placeholder="Ex: kg" required />
        <Campo rotulo="Quantidade em estoque" name="quantidadeEstoque" type="number" step="any" defaultValue={0} />
        <Campo rotulo="Preço unitário" name="precoUnitario" type="number" step="any" defaultValue={0} />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
