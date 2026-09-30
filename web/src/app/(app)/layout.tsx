import { Nav } from "@/components/Nav";

// Todas as paginas aqui dentro leem dados direto do banco a cada acesso
// (produtos, pedidos, clientes, etc. mudam o tempo todo), entao nunca
// devem ser pre-renderizadas estaticamente no build.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
