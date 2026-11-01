import Link from "next/link";
import * as ingredientesLib from "@/lib/ingredientes";
import { atualizarIngredienteNaCalculadora } from "./actions";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { BarraBusca, correspondeBusca } from "@/components/ui/BarraBusca";
import { Botao } from "@/components/ui/Botao";

// Mostra o preco por grama/unidade com o minimo de casas decimais que ainda
// representa o valor exatamente (entre 2 e 4), em vez de sempre 4 casas fixas
// (ex: R$ 6,9900 vira R$ 6,99; R$ 0,0045 continua R$ 0,0045).
function formatarPrecoBase(valor: number): string {
  for (let casas = 2; casas <= 4; casas++) {
    if (Math.abs(parseFloat(valor.toFixed(casas)) - valor) < 1e-9) {
      return valor.toFixed(casas);
    }
  }
  return valor.toFixed(4);
}

export default async function CalculadoraIngredientesPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { buscar } = await searchParams;
  const todos = await ingredientesLib.listarIngredientes();
  const itens = todos.filter((i) => correspondeBusca(buscar ?? "", i.nome));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Custo dos ingredientes</h2>
          <p className="text-sm text-texto-suave">
            Os valores podem ser editados direto aqui — útil porque o preço no mercado muda com frequência. Para
            editar nome ou estoque, use a tela{" "}
            <Link href="/ingredientes" className="font-bold text-terracota hover:underline">
              Ingredientes
            </Link>
            .
          </p>
        </div>
        <Link href="/calculadora" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <BarraBusca buscar={buscar} placeholder="Buscar ingrediente" />

      {/* Um <form> vazio por linha, fora da tabela (um <form> não pode envolver
          <td>s dentro de um <tr>). Os campos de cada linha se associam a ele
          pelo atributo form="...", que é válido em qualquer lugar do documento.
          Fica tudo dentro de um único wrapper pra não contar como filho direto
          do container com space-y-6 (senão cada form ganharia margem). */}
      <div className="hidden">
        {itens.map((i) => {
          const salvar = atualizarIngredienteNaCalculadora.bind(null, i.id);
          return <form key={i.id} id={`form-ingrediente-${i.id}`} action={salvar} />;
        })}
      </div>

      <Tabela>
        <TabelaCabecalho colunas={["Ingrediente", "Tipo", "Peso/Qtd. da embalagem fechada", "Custo da embalagem", "Custo por peso/unidade", ""]} />
        <tbody>
          {itens.length === 0 && <TabelaVazia colunas={6} texto="Nenhum ingrediente encontrado." />}
          {itens.map((i) => {
            const porUnidade = i.unidade === "un";
            const idFormulario = `form-ingrediente-${i.id}`;
            return (
              <TabelaLinha key={i.id}>
                <TabelaCelula>{i.nome}</TabelaCelula>
                <TabelaCelula>
                  <select
                    form={idFormulario}
                    name="unidade"
                    defaultValue={i.unidade === "un" ? "un" : "g"}
                    className="rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  >
                    <option value="g">Por peso (g)</option>
                    <option value="un">Por unidade</option>
                  </select>
                </TabelaCelula>
                <TabelaCelula>
                  <input
                    form={idFormulario}
                    name="gramasPorEmbalagem"
                    type="number"
                    step="any"
                    defaultValue={i.gramasPorEmbalagem}
                    className="w-24 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  />{" "}
                  <span className="text-xs text-texto-suave">{porUnidade ? "un" : "g"}</span>
                </TabelaCelula>
                <TabelaCelula>
                  <span className="mr-1">R$</span>
                  <input
                    form={idFormulario}
                    name="precoEmbalagem"
                    type="number"
                    step="any"
                    defaultValue={i.precoEmbalagem}
                    className="w-24 rounded-full border border-borda bg-painel-claro px-3 py-1.5 text-sm"
                  />
                </TabelaCelula>
                <TabelaCelula>
                  R$ {formatarPrecoBase(i.precoUnitario)}
                  {porUnidade ? "/un" : "/g"}
                </TabelaCelula>
                <TabelaCelula>
                  <Botao form={idFormulario} type="submit" variante="fantasma" className="px-3 py-1.5 text-xs">
                    Salvar
                  </Botao>
                </TabelaCelula>
              </TabelaLinha>
            );
          })}
        </tbody>
      </Tabela>
    </div>
  );
}
