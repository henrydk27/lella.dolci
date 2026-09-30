"use client";

import { useRouter } from "next/navigation";

function somarDias(data: string, dias: number): string {
  const d = new Date(data + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function SeletorData({ data }: { data: string }) {
  const router = useRouter();

  function irPara(novaData: string) {
    router.push(`/planejador?data=${novaData}`);
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => irPara(somarDias(data, -1))}
        className="rounded-full border border-borda bg-painel-claro px-3 py-2 text-sm font-bold hover:bg-selecao"
      >
        ← Anterior
      </button>
      <input
        type="date"
        value={data}
        onChange={(e) => irPara(e.target.value)}
        className="rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => irPara(somarDias(data, 1))}
        className="rounded-full border border-borda bg-painel-claro px-3 py-2 text-sm font-bold hover:bg-selecao"
      >
        Próximo →
      </button>
      {data !== hoje && (
        <button
          type="button"
          onClick={() => irPara(hoje)}
          className="rounded-full bg-terracota px-3 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
