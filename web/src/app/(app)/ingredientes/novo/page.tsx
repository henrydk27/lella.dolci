import { criarIngrediente } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovoIngredientePage() {
  return (
    <Cartao titulo="Novo ingrediente" className="max-w-lg">
      <form action={criarIngrediente} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Farinha de trigo" required />
        <Campo rotulo="Quantidade em estoque" name="quantidadeEstoque" type="number" step="any" defaultValue={0} />
        <Campo
          rotulo="Quantas gramas tem o produto"
          name="gramasPorEmbalagem"
          type="number"
          step="any"
          placeholder="Ex: 1000"
        />
        <Campo
          rotulo="Valor do produto"
          name="precoEmbalagem"
          type="number"
          step="any"
          placeholder="Ex: 8.50"
        />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
