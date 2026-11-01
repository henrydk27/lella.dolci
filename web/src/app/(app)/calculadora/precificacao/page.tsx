import Link from "next/link";
import * as ingredientesLib from "@/lib/ingredientes";
import * as embalagensLib from "@/lib/embalagens";
import { CalculadoraPrecificacao } from "./CalculadoraPrecificacao";

export default async function CalculadoraPrecificacaoPage() {
  const ingredientes = await ingredientesLib.listarIngredientes();
  const embalagens = await embalagensLib.listarEmbalagens();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Calculadora de precificação</h2>
          <p className="text-sm text-texto-suave">
            Simule uma receita nova antes de cadastrar como produto. Nada aqui é salvo.
          </p>
        </div>
        <Link href="/calculadora" className="text-sm font-bold text-terracota hover:underline">
          Voltar
        </Link>
      </div>

      <CalculadoraPrecificacao
        ingredientes={ingredientes.map((i) => ({
          id: i.id,
          nome: i.nome,
          precoEmbalagem: i.precoEmbalagem,
          gramasPorEmbalagem: i.gramasPorEmbalagem,
          precoPorGrama: i.precoUnitario,
        }))}
        embalagens={embalagens.map((e) => ({
          id: e.id,
          nome: e.nome,
          custoUnitario: embalagensLib.calcularCustoUnitario(e),
        }))}
      />
    </div>
  );
}
