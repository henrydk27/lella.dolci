"use client";

import { useId, useMemo, useState } from "react";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

interface IngredienteOpcao {
  id: number;
  nome: string;
  precoEmbalagem: number;
  gramasPorEmbalagem: number;
  precoPorGrama: number;
}

interface EmbalagemOpcao {
  id: number;
  nome: string;
  custoUnitario: number;
}

interface LinhaIngrediente {
  chave: string;
  ingredienteId: number | null;
  gramas: number;
}

interface LinhaEmbalagem {
  chave: string;
  embalagemId: number | null;
  quantidade: number;
}

export function CalculadoraPrecificacao({
  ingredientes,
  embalagens,
}: {
  ingredientes: IngredienteOpcao[];
  embalagens: EmbalagemOpcao[];
}) {
  const geradorId = useId();
  let proximoId = 0;
  const novaChave = () => `${geradorId}-${proximoId++}`;

  const [linhasIngredientes, setLinhasIngredientes] = useState<LinhaIngrediente[]>([
    { chave: novaChave(), ingredienteId: null, gramas: 0 },
  ]);
  const [linhasEmbalagens, setLinhasEmbalagens] = useState<LinhaEmbalagem[]>([
    { chave: novaChave(), embalagemId: null, quantidade: 0 },
  ]);
  const [taxaVariaveis, setTaxaVariaveis] = useState(10);
  const [rendimento, setRendimento] = useState(1);
  const [precoVenda, setPrecoVenda] = useState(0);

  const mapaIngredientes = useMemo(() => new Map(ingredientes.map((i) => [i.id, i])), [ingredientes]);
  const mapaEmbalagens = useMemo(() => new Map(embalagens.map((e) => [e.id, e])), [embalagens]);

  // Custo utilizado = (Preço da embalagem ÷ Peso da embalagem) × Gramas utilizadas
  const totalDosCustos = linhasIngredientes.reduce((soma, linha) => {
    const ingrediente = linha.ingredienteId ? mapaIngredientes.get(linha.ingredienteId) : null;
    if (!ingrediente) return soma;
    return soma + linha.gramas * ingrediente.precoPorGrama;
  }, 0);

  // Os 10% incidem somente sobre os ingredientes — nunca sobre as embalagens.
  const despesasVariaveis = totalDosCustos * (taxaVariaveis / 100);

  // Preço por embalagem individual: soma das embalagens/tecidos/fitas usados
  // em UMA unidade vendida (não é dividido pelo rendimento de novo).
  const precoPorEmbalagemIndividual = linhasEmbalagens.reduce((soma, linha) => {
    const embalagem = linha.embalagemId ? mapaEmbalagens.get(linha.embalagemId) : null;
    if (!embalagem) return soma;
    return soma + linha.quantidade * embalagem.custoUnitario;
  }, 0);

  const precoPorUnidade = rendimento > 0 ? (totalDosCustos + despesasVariaveis) / rendimento : 0;
  const precoFinalSemLucro = precoPorUnidade + precoPorEmbalagemIndividual;

  const lucroPorUnidade = precoVenda - precoFinalSemLucro;
  const margemPercentual = precoVenda > 0 ? (lucroPorUnidade / precoVenda) * 100 : 0;
  const lucroLiquidoTotal = lucroPorUnidade * rendimento;
  const precoVendaTotal = precoVenda * rendimento;

  function atualizarLinhaIngrediente(chave: string, dados: Partial<LinhaIngrediente>) {
    setLinhasIngredientes((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...dados } : l)));
  }

  function atualizarLinhaEmbalagem(chave: string, dados: Partial<LinhaEmbalagem>) {
    setLinhasEmbalagens((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...dados } : l)));
  }

  return (
    <div className="space-y-6">
      <Cartao titulo="Tabela de ingredientes">
        <div className="space-y-3">
          {linhasIngredientes.map((linha) => {
            const ingrediente = linha.ingredienteId ? mapaIngredientes.get(linha.ingredienteId) : null;
            const quantoCustou = ingrediente ? linha.gramas * ingrediente.precoPorGrama : 0;
            return (
              <div
                key={linha.chave}
                className="grid grid-cols-1 gap-2 rounded-xl border border-borda/60 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-end"
              >
                <CampoSelect
                  rotulo="Ingrediente"
                  value={linha.ingredienteId ?? ""}
                  onChange={(e) =>
                    atualizarLinhaIngrediente(linha.chave, {
                      ingredienteId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  opcoes={[
                    { valor: "", texto: "Selecione..." },
                    ...ingredientes.map((i) => ({ valor: String(i.id), texto: i.nome })),
                  ]}
                />
                <div>
                  <span className="mb-1 block text-xs font-semibold text-texto">Custo dos ingredientes</span>
                  <p className="rounded-full bg-painel-claro px-3 py-2 text-sm text-texto-suave">
                    {ingrediente ? `R$ ${ingrediente.precoEmbalagem.toFixed(2)}` : "-"}
                  </p>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-texto">Peso da embalagem (g)</span>
                  <p className="rounded-full bg-painel-claro px-3 py-2 text-sm text-texto-suave">
                    {ingrediente ? ingrediente.gramasPorEmbalagem : "-"}
                  </p>
                </div>
                <Campo
                  rotulo="Gramas utilizadas"
                  type="number"
                  step="any"
                  value={linha.gramas || ""}
                  onChange={(e) => atualizarLinhaIngrediente(linha.chave, { gramas: Number(e.target.value) || 0 })}
                />
                <div>
                  <span className="mb-1 block text-xs font-semibold text-texto">Quanto custou</span>
                  <p className="rounded-full bg-painel-claro px-3 py-2 text-sm font-bold text-terracota-vibrante">
                    R$ {quantoCustou.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLinhasIngredientes((atual) => atual.filter((l) => l.chave !== linha.chave))}
                  className="whitespace-nowrap pb-2 text-xs font-bold text-alerta hover:underline sm:pb-3"
                >
                  remover
                </button>
              </div>
            );
          })}
        </div>
        <Botao
          type="button"
          variante="fantasma"
          className="mt-3"
          onClick={() =>
            setLinhasIngredientes((atual) => [...atual, { chave: novaChave(), ingredienteId: null, gramas: 0 }])
          }
        >
          + Adicionar ingrediente
        </Botao>
      </Cartao>

      <Cartao titulo="Embalagens, tecidos e fitas (usados em uma unidade)">
        <div className="space-y-3">
          {linhasEmbalagens.map((linha) => {
            const embalagem = linha.embalagemId ? mapaEmbalagens.get(linha.embalagemId) : null;
            const custoLinha = embalagem ? linha.quantidade * embalagem.custoUnitario : 0;
            return (
              <div key={linha.chave} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <CampoSelect
                    rotulo="Embalagem"
                    value={linha.embalagemId ?? ""}
                    onChange={(e) =>
                      atualizarLinhaEmbalagem(linha.chave, {
                        embalagemId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    opcoes={[
                      { valor: "", texto: "Selecione..." },
                      ...embalagens.map((e) => ({ valor: String(e.id), texto: e.nome })),
                    ]}
                  />
                </div>
                <Campo
                  rotulo="Quantidade"
                  type="number"
                  step="any"
                  className="w-full sm:w-28"
                  value={linha.quantidade || ""}
                  onChange={(e) => atualizarLinhaEmbalagem(linha.chave, { quantidade: Number(e.target.value) || 0 })}
                />
                <div className="whitespace-nowrap pb-2 text-sm font-bold text-terracota-vibrante sm:w-24">
                  R$ {custoLinha.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => setLinhasEmbalagens((atual) => atual.filter((l) => l.chave !== linha.chave))}
                  className="whitespace-nowrap pb-2 text-xs font-bold text-alerta hover:underline"
                >
                  remover
                </button>
              </div>
            );
          })}
        </div>
        <Botao
          type="button"
          variante="fantasma"
          className="mt-3"
          onClick={() =>
            setLinhasEmbalagens((atual) => [...atual, { chave: novaChave(), embalagemId: null, quantidade: 0 }])
          }
        >
          + Adicionar embalagem
        </Botao>
      </Cartao>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cartao titulo="Contas finais">
          <div className="grid grid-cols-2 gap-3">
            <Campo
              rotulo="Despesas variáveis (%) — água, energia, gás"
              type="number"
              step="any"
              value={taxaVariaveis}
              onChange={(e) => setTaxaVariaveis(Number(e.target.value) || 0)}
            />
            <Campo
              rotulo="Rendimento (quantidade produzida)"
              type="number"
              step="any"
              value={rendimento}
              onChange={(e) => setRendimento(Number(e.target.value) || 0)}
            />
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="text-texto-suave">Total dos custos (ingredientes): </span>
              <strong className="text-texto">R$ {totalDosCustos.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">+ {taxaVariaveis}% de despesas variáveis: </span>
              <strong className="text-texto">R$ {despesasVariaveis.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">Preço por unidade (sem embalagem): </span>
              <strong className="text-texto">R$ {precoPorUnidade.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">Preço por embalagem individual: </span>
              <strong className="text-texto">R$ {precoPorEmbalagemIndividual.toFixed(2)}</strong>
            </p>
            <p className="pt-1">
              <span className="text-texto-suave">Preço final sem lucro: </span>
              <strong className="text-terracota-vibrante">R$ {precoFinalSemLucro.toFixed(2)}</strong>
            </p>
          </div>
        </Cartao>

        <Cartao titulo="Preço de venda">
          <Campo
            rotulo="Preço de venda (unidade)"
            type="number"
            step="any"
            value={precoVenda || ""}
            onChange={(e) => setPrecoVenda(Number(e.target.value) || 0)}
          />

          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="text-texto-suave">Lucro por unidade: </span>
              <strong className={lucroPorUnidade >= 0 ? "text-salvia" : "text-alerta"}>
                R$ {lucroPorUnidade.toFixed(2)} ({margemPercentual.toFixed(1)}%)
              </strong>
            </p>
            <p>
              <span className="text-texto-suave">Preço de venda total: </span>
              <strong className="text-texto">R$ {precoVendaTotal.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">Lucro líquido total: </span>
              <strong className={lucroLiquidoTotal >= 0 ? "text-salvia" : "text-alerta"}>
                R$ {lucroLiquidoTotal.toFixed(2)}
              </strong>
            </p>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
