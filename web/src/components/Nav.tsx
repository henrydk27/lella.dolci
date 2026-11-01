import Link from "next/link";
import { encerrarSessao } from "@/lib/auth";

const ITENS = [
  { href: "/", texto: "Início" },
  { href: "/dashboard", texto: "Dashboard" },
  { href: "/clientes", texto: "Clientes" },
  { href: "/produtos", texto: "Produtos" },
  { href: "/ingredientes", texto: "Ingredientes" },
  { href: "/embalagens", texto: "Embalagens" },
  { href: "/planejador", texto: "Planejador" },
  { href: "/pedidos", texto: "Pedidos" },
  { href: "/historico", texto: "Histórico" },
  { href: "/financeiro", texto: "Financeiro" },
];

const SUBMENU_CALCULADORA = [
  { href: "/calculadora/ingredientes", texto: "Custo dos ingredientes" },
  { href: "/calculadora/embalagens", texto: "Embalagens" },
  { href: "/calculadora/precificacao", texto: "Calculadora de precificação" },
  { href: "/calculadora/receitas", texto: "Receitas prontas" },
];

export function Nav() {
  async function sair() {
    "use server";
    await encerrarSessao();
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  return (
    <header className="border-b border-borda bg-painel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <h1 className="font-titulo text-2xl text-terracota-vibrante">Lella Dolci</h1>
          <p className="text-sm text-texto-suave">controle de vendas</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao"
            >
              {item.texto}
            </Link>
          ))}
          <div className="group relative inline-flex items-center">
            <Link
              href="/calculadora"
              className="rounded-full px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao"
            >
              Calculadora
            </Link>
            <div className="invisible absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-borda bg-painel p-2 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {SUBMENU_CALCULADORA.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-texto hover:bg-selecao"
                >
                  {item.texto}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          {/* link comum (nao o <Link> do Next): precisa ser uma navegacao de
              verdade do navegador para o download do arquivo funcionar */}
          <a
            href="/api/backup"
            className="rounded-full border border-terracota px-3 py-1.5 text-sm font-bold text-terracota-vibrante hover:bg-terracota/10"
          >
            Backup
          </a>
          <form action={sair}>
            <button className="rounded-full border border-borda px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
