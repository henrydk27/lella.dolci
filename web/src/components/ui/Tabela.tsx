import { ReactNode } from "react";
import Link from "next/link";
import type { Direcao } from "@/lib/ordenacao";

export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-borda bg-painel-claro">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function TabelaCabecalho({ colunas }: { colunas: string[] }) {
  return (
    <thead className="bg-painel">
      <tr>
        {colunas.map((c) => (
          <th key={c} className="whitespace-nowrap px-4 py-3 font-bold text-terracota-vibrante">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Cabecalho com colunas clicaveis que ordenam a tabela via query string
// (?ordenar=campo&dir=asc|desc), usado em todas as telas de listagem.
export function TabelaCabecalhoOrdenavel({
  colunas,
  campoAtivo,
  direcao,
  gerarHref,
  extras = [],
}: {
  colunas: { campo: string; rotulo: string }[];
  campoAtivo: string;
  direcao: Direcao;
  gerarHref: (campo: string) => string;
  extras?: string[];
}) {
  return (
    <thead className="bg-painel">
      <tr>
        {colunas.map((c) => (
          <th key={c.campo} className="whitespace-nowrap px-4 py-3 font-bold text-terracota-vibrante">
            <Link href={gerarHref(c.campo)} className="flex items-center gap-1 hover:underline">
              {c.rotulo}
              {campoAtivo === c.campo && <span>{direcao === "asc" ? "▲" : "▼"}</span>}
            </Link>
          </th>
        ))}
        {extras.map((e, i) => (
          <th key={i} className="whitespace-nowrap px-4 py-3 font-bold text-terracota-vibrante">
            {e}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TabelaLinha({ children }: { children: ReactNode }) {
  return <tr className="border-t border-borda/60 hover:bg-selecao">{children}</tr>;
}

export function TabelaCelula({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3">{children}</td>;
}

export function TabelaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td colSpan={colunas} className="px-4 py-6 text-center text-texto-suave">
        {texto}
      </td>
    </tr>
  );
}
