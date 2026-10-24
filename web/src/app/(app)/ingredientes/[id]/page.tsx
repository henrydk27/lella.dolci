import { notFound } from "next/navigation";
import * as ingredientes from "@/lib/ingredientes";
import { atualizarIngrediente, removerIngrediente, ajustarEstoqueIngrediente } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default async function EditarIngredientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingrediente = await ingredientes.buscarIngrediente(Number(id));
  if (!ingrediente) notFound();

  const salvar = atualizarIngrediente.bind(null, ingrediente.id);
  const remover = removerIngrediente.bind(null, ingrediente.id);
  const ajustar = ajustarEstoqueIngrediente.bind(null, ingrediente.id);

  const unidadeAntiga = ingrediente.unidade !== "g";

  return (
    <div className="max-w-lg space-y-6">
      <Cartao titulo="Editar ingrediente">
        {unidadeAntiga && (
          <p className="mb-4 rounded-xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta">
            Este ingrediente foi cadastrado em &quot;{ingrediente.unidade}&quot;. Ao salvar, ele passa a ser tratado
            em gramas — preencha os campos do produto abaixo com os valores corretos em gramas antes de salvar.
          </p>
        )}
        <form action={salvar} className="space-y-4">
          <Campo rotulo="Nome" name="nome" defaultValue={ingrediente.nome} required />
          <Campo
            rotulo="Quantidade em estoque"
            name="quantidadeEstoque"
            type="number"
            step="any"
            defaultValue={ingrediente.quantidadeEstoque}
          />
          <Campo
            rotulo="Quantas gramas tem o produto"
            name="gramasPorEmbalagem"
            type="number"
            step="any"
            defaultValue={ingrediente.gramasPorEmbalagem}
          />
          <Campo
            rotulo="Valor do produto"
            name="precoEmbalagem"
            type="number"
            step="any"
            defaultValue={ingrediente.precoEmbalagem}
          />
          <p className="text-sm font-bold text-terracota-vibrante">
            Preço por grama: R$ {ingrediente.precoUnitario.toFixed(4)}
          </p>
          <Botao type="submit">Salvar</Botao>
        </form>
        <form action={remover} className="mt-3">
          <Botao type="submit" perigo>
            Remover
          </Botao>
        </form>
      </Cartao>

      <Cartao titulo="Ajustar estoque (+/-)">
        <form action={ajustar} className="flex items-end gap-3">
          <Campo rotulo="Quantidade (negativo para remover)" name="delta" type="number" step="any" placeholder="Ex: -2" />
          <Botao type="submit">Aplicar</Botao>
        </form>
      </Cartao>
    </div>
  );
}
