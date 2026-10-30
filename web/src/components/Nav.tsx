import Link from "next/link";
import { encerrarSessao } from "@/lib/auth";

const ITENS = [
  { href: "/", texto: "Início" },
  { href: "/clientes", texto: "Clientes" },
  { href: "/produtos", texto: "Produtos" },
  { href: "/ingredientes", texto: "Ingredientes" },
  { href: "/embalagens", texto: "Embalagens" },
  { href: "/planejador", texto: "Planejador" },
  { href: "/pedidos", texto: "Pedidos" },
  { href: "/historico", texto: "Histórico" },
  { href: "/gastos", texto: "Gastos" },
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
        <nav className="flex flex-wrap gap-1">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao"
            >
              {item.texto}
            </Link>
          ))}
          {/* link comum (nao o <Link> do Next): precisa ser uma navegacao de
              verdade do navegador para o download do arquivo funcionar */}
          <a
            href="/api/backup"
            className="rounded-full px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao"
          >
            Backup
          </a>
        </nav>
        <form action={sair}>
          <button className="rounded-full border border-borda px-3 py-1.5 text-sm font-bold text-texto hover:bg-selecao">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
