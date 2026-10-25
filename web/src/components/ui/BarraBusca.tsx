// Barra de busca via query string (?buscar=...), usada em todas as telas de
// listagem. Preserva outros parametros da URL (ordenacao, filtros) via
// inputs escondidos, para nao perder o estado atual ao buscar.
export function BarraBusca({
  buscar,
  placeholder,
  camposOcultos,
}: {
  buscar?: string;
  placeholder?: string;
  camposOcultos?: Record<string, string | undefined>;
}) {
  return (
    <form method="get" className="flex gap-2">
      <input
        type="text"
        name="buscar"
        defaultValue={buscar ?? ""}
        placeholder={placeholder ?? "Buscar..."}
        className="w-full rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
      />
      {camposOcultos &&
        Object.entries(camposOcultos).map(([nome, valor]) =>
          valor ? <input key={nome} type="hidden" name={nome} value={valor} /> : null
        )}
      <button
        type="submit"
        className="whitespace-nowrap rounded-full bg-terracota px-4 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover"
      >
        Buscar
      </button>
    </form>
  );
}

export function correspondeBusca(termo: string, ...campos: (string | null | undefined)[]): boolean {
  if (!termo) return true;
  const alvo = termo.trim().toLowerCase();
  return campos.some((c) => c && c.toLowerCase().includes(alvo));
}
