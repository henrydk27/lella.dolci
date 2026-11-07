// Regras de preco das caixas fechadas, compartilhadas entre o formulario de
// novo pedido (cliente) e a action que de fato grava o pedido (servidor) -
// pra nunca confiar num preco por unidade calculado so no navegador.
export const OPCOES_CAIXA = ["", "Caixa com 4", "Caixa com 6"];

export function tamanhoDaCaixa(valor: string): number {
  if (valor === "Caixa com 4") return 4;
  if (valor === "Caixa com 6") return 6;
  return 0;
}

// Preco fixo da caixa fechada, independente dos sabores escolhidos (e' assim
// que sempre foi cobrado, visto no historico de vendas).
export const PRECO_CAIXA: Record<number, number> = { 4: 10, 6: 14 };

export function precoPorUnidadeDaCaixa(tamanhoCaixa: number): number {
  const precoTotal = PRECO_CAIXA[tamanhoCaixa];
  if (!precoTotal || tamanhoCaixa <= 0) return 0;
  return precoTotal / tamanhoCaixa;
}
