// Regras de preco das caixas fechadas, compartilhadas entre o formulario de
// novo pedido (cliente) e a action que de fato grava o pedido (servidor) -
// pra nunca confiar num preco por unidade calculado so no navegador.
export interface OpcaoCaixa {
  valor: string;
  tamanho: number;
  precoTotal: number;
}

// Preco fixo de cada caixa fechada, independente dos sabores escolhidos
// (e' assim que sempre foi cobrado, visto no historico de vendas). Caixas
// "Premium" tem o mesmo tamanho (numero de espacos) que a versao comum, mas
// um preco fechado mais alto - por isso a chave e' o nome da caixa inteiro,
// nao so o tamanho.
export const OPCOES_CAIXA: OpcaoCaixa[] = [
  { valor: "", tamanho: 0, precoTotal: 0 },
  { valor: "Caixa com 4", tamanho: 4, precoTotal: 10 },
  { valor: "Caixa com 6", tamanho: 6, precoTotal: 14 },
  { valor: "Caixa c/4 Premium", tamanho: 4, precoTotal: 14 },
  { valor: "Caixa c/6 Premium", tamanho: 6, precoTotal: 18 },
];

export function buscarOpcaoCaixa(valor: string): OpcaoCaixa | undefined {
  return OPCOES_CAIXA.find((o) => o.valor === valor);
}

export function tamanhoDaCaixa(valor: string): number {
  return buscarOpcaoCaixa(valor)?.tamanho ?? 0;
}

export function precoTotalDaCaixa(valor: string): number {
  return buscarOpcaoCaixa(valor)?.precoTotal ?? 0;
}

export function precoPorUnidadeDaCaixa(valor: string): number {
  const opcao = buscarOpcaoCaixa(valor);
  if (!opcao || opcao.tamanho <= 0) return 0;
  return opcao.precoTotal / opcao.tamanho;
}
