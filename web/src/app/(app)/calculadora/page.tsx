import Link from "next/link";
import { Cartao } from "@/components/ui/Cartao";

const ITENS = [
  {
    href: "/calculadora/ingredientes",
    titulo: "Custo dos ingredientes",
    descricao: "Consulte o preço por grama de cada ingrediente já cadastrado.",
  },
  {
    href: "/calculadora/embalagens",
    titulo: "Embalagens",
    descricao: "Consulte o custo por unidade de cada embalagem já cadastrada.",
  },
  {
    href: "/calculadora/precificacao",
    titulo: "Calculadora de precificação",
    descricao: "Monte uma receita nova e descubra o custo e o preço sugerido antes de cadastrar o produto.",
  },
  {
    href: "/calculadora/receitas",
    titulo: "Receitas prontas",
    descricao: "Veja o custo detalhado de todos os produtos já cadastrados, um ao lado do outro.",
  },
];

export default function CalculadoraPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-titulo text-xl text-terracota-vibrante">Calculadora</h2>
        <p className="text-sm text-texto-suave">Ferramentas de consulta e precificação, sem mexer nos cadastros.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ITENS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Cartao titulo={item.titulo} className="h-full transition-colors hover:bg-selecao">
              <p className="text-sm text-texto-suave">{item.descricao}</p>
            </Cartao>
          </Link>
        ))}
      </div>
    </div>
  );
}
