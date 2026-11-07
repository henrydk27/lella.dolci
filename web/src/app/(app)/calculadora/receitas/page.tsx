import Link from "next/link";
import * as receitasLib from "@/lib/receitas";
import * as ingredientesLib from "@/lib/ingredientes";
import {
  criarReceita,
  atualizarReceita,
  removerReceita,
  adicionarIngredienteReceita,
  removerIngredienteReceita,
} from "./actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import type { Receita } from "@/lib/receitas";

async function CardReceita({
  receita,
  opcoesIngredientes,
}: {
  receita: Receita;
  opcoesIngredientes: { valor: string; texto: string }[];
}) {
  const itens = await receitasLib.listarIngredientesDaReceita(receita.id);
  const custo = await receitasLib.calcularCustoReceita(receita.id);

  const salvar = atualizarReceita.bind(null, receita.id);
  const remover = removerReceita.bind(null, receita.id);
  const addIngrediente = adicionarIngredienteReceita.bind(null, receita.id);

  return (
    <Cartao>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-titulo text-lg text-terracota-vibrante">{receita.nome}</h3>
          {receita.pesoUnidadeGramas ? (
            <p className="text-xs text-texto-suave">{receita.pesoUnidadeGramas}g por unidade</p>
          ) : null}
        </div>
        <form action={remover}>
          <button type="submit" className="whitespace-nowrap text-xs font-bold text-alerta hover:underline">
            remover receita
          </button>
        </form>
      </div>

      <ul className="my-3 space-y-1 text-sm">
        {itens.length === 0 && <li className="text-texto-suave">Nenhum ingrediente adicionado.</li>}
        {itens.map((i) => {
          const removerEste = removerIngredienteReceita.bind(null, i.id);
          return (
            <li key={i.id} className="flex items-center justify-between gap-2 rounded-lg bg-painel-claro px-3 py-1.5">
              <span>
                {i.nome} — {i.gramasUsadas}g
              </span>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-texto-suave">R$ {(i.gramasUsadas * i.precoPorGrama).toFixed(2)}</span>
                <form action={removerEste}>
                  <button type="submit" className="text-xs font-bold text-alerta hover:underline">
                    remover
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <form action={addIngrediente} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <CampoSelect
            name="ingredienteId"
            opcoes={[{ valor: "", texto: "Selecione o ingrediente..." }, ...opcoesIngredientes]}
          />
        </div>
        <Campo name="gramasUsadas" type="number" step="any" placeholder="Gramas" className="w-full sm:w-24" />
        <Botao type="submit" className="w-full sm:w-auto">
          + Adicionar
        </Botao>
      </form>

      <div className="space-y-1 border-t border-borda pt-3 text-sm">
        <p>
          <span className="text-texto-suave">Custo dos ingredientes: </span>
          <strong className="text-texto">R$ {custo.custoIngredientes.toFixed(2)}</strong>
        </p>
        <p>
          <span className="text-texto-suave">Taxa gás/luz/água ({receita.taxaOverhead}%): </span>
          <strong className="text-texto">R$ {custo.custoOverhead.toFixed(2)}</strong>
        </p>
        <p>
          <span className="text-texto-suave">Custo total: </span>
          <strong className="text-texto">R$ {custo.custoTotal.toFixed(2)}</strong>
        </p>
        <p>
          <span className="text-texto-suave">Preço por unidade: </span>
          <strong className="text-terracota-vibrante">R$ {custo.precoPorUnidade.toFixed(2)}</strong>
        </p>
      </div>

      <form action={salvar} className="mt-4 space-y-3 border-t border-borda pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome" name="nome" defaultValue={receita.nome} required />
          <CampoSelect
            rotulo="Grupo"
            name="grupo"
            defaultValue={receita.grupo}
            opcoes={[
              { valor: "brigadeiro", texto: "Brigadeiro" },
              { valor: "outros", texto: "Outros" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Rendimento (unidades)" name="rendimento" type="number" step="any" defaultValue={receita.rendimento} />
          <Campo
            rotulo="Peso por unidade (g) — opcional"
            name="pesoUnidadeGramas"
            type="number"
            step="any"
            defaultValue={receita.pesoUnidadeGramas ?? ""}
          />
        </div>
        <Campo
          rotulo="Taxa gás/luz/água (%)"
          name="taxaOverhead"
          type="number"
          step="any"
          defaultValue={receita.taxaOverhead}
        />
        <CampoArea rotulo="Observações" name="observacoes" defaultValue={receita.observacoes ?? ""} rows={2} />
        <Botao type="submit" variante="fantasma">
          Salvar
        </Botao>
      </form>
    </Cartao>
  );
}

export default async function CalculadoraReceitasPage() {
  const todasReceitas = await receitasLib.listarReceitas();
  const todosIngredientes = await ingredientesLib.listarIngredientes();
  const opcoesIngredientes = todosIngredientes.map((i) => ({ valor: String(i.id), texto: i.nome }));

  const brigadeiros = todasReceitas.filter((r) => r.grupo === "brigadeiro");
  const outros = todasReceitas.filter((r) => r.grupo !== "brigadeiro");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Receitas prontas</h2>
          <p className="text-sm text-texto-suave">
            Livro de receitas com custo sempre atualizado pelo preço atual dos ingredientes.
          </p>
        </div>
        <Link href="/calculadora" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <Cartao titulo="Nova receita">
        <form action={criarReceita} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo rotulo="Nome" name="nome" required />
            <CampoSelect
              rotulo="Grupo"
              name="grupo"
              opcoes={[
                { valor: "brigadeiro", texto: "Brigadeiro" },
                { valor: "outros", texto: "Outros" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Rendimento (unidades)" name="rendimento" type="number" step="any" defaultValue={1} />
            <Campo rotulo="Peso por unidade (g) — opcional" name="pesoUnidadeGramas" type="number" step="any" />
          </div>
          <Campo rotulo="Taxa gás/luz/água (%)" name="taxaOverhead" type="number" step="any" defaultValue={10} />
          <CampoArea rotulo="Observações" name="observacoes" rows={2} />
          <Botao type="submit">+ Criar receita</Botao>
        </form>
      </Cartao>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <h3 className="font-titulo text-lg text-terracota-vibrante">Brigadeiros</h3>
          {brigadeiros.length === 0 && <p className="text-sm text-texto-suave">Nenhuma receita de brigadeiro ainda.</p>}
          {brigadeiros.map((receita) => (
            <CardReceita key={receita.id} receita={receita} opcoesIngredientes={opcoesIngredientes} />
          ))}
        </div>
        <div className="space-y-6">
          <h3 className="font-titulo text-lg text-terracota-vibrante">Outros produtos</h3>
          {outros.length === 0 && <p className="text-sm text-texto-suave">Nenhuma receita cadastrada ainda.</p>}
          {outros.map((receita) => (
            <CardReceita key={receita.id} receita={receita} opcoesIngredientes={opcoesIngredientes} />
          ))}
        </div>
      </div>
    </div>
  );
}
