export type Direcao = "asc" | "desc";

export function configurarOrdenacao(
  campoAtivoBruto: string | undefined,
  direcaoBruta: string | undefined,
  campoPadrao: string,
  camposValidos: string[]
): { campoAtivo: string; direcao: Direcao } {
  const campoAtivo = campoAtivoBruto && camposValidos.includes(campoAtivoBruto) ? campoAtivoBruto : campoPadrao;
  const direcao: Direcao = direcaoBruta === "asc" ? "asc" : "desc";
  return { campoAtivo, direcao };
}

export function ordenarLista<T>(
  itens: T[],
  campoAtivo: string,
  direcao: Direcao,
  valor: (item: T, campo: string) => string | number
): T[] {
  return [...itens].sort((a, b) => {
    const va = valor(a, campoAtivo);
    const vb = valor(b, campoAtivo);
    if (va < vb) return direcao === "asc" ? -1 : 1;
    if (va > vb) return direcao === "asc" ? 1 : -1;
    return 0;
  });
}

// Mantem outros filtros da URL (ex: tipo, status, periodo) ao trocar a ordenacao.
export function gerarHrefOrdenar(
  pathname: string,
  paramsAtuais: Record<string, string | undefined>,
  campo: string,
  campoAtivo: string,
  direcao: Direcao
): string {
  const novaDirecao: Direcao = campoAtivo === campo && direcao === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsAtuais)) {
    if (v) params.set(k, v);
  }
  params.set("ordenar", campo);
  params.set("dir", novaDirecao);
  return `${pathname}?${params.toString()}`;
}
