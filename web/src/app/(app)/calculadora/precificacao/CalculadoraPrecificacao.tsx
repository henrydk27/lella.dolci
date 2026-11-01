"use client";

import { useId, useMemo, useState } from "react";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

interface IngredienteOpcao {
  id: number;
  nome: string;
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
  const [taxaOverhead, setTaxaOverhead] = useState(10);
  const [rendimento, setRendimento] = useState(1);
  const [precoVenda, setPrecoVenda] = useState(0);

  const mapaIngredientes = useMemo(() => new Map(ingredientes.map((i) => [i.id, i])), [ingredientes]);
  const mapaEmbalagens = useMemo(() => new Map(embalagens.map((e) => [e.id, e])), [embalagens]);

  const custoIngredientes = linhasIngredientes.reduce((soma, linha) => {
    const ingrediente = linha.ingredienteId ? mapaIngredientes.get(linha.ingredienteId) : null;
    if (!ingrediente) return soma;
    return soma + linha.gramas * ingrediente.precoPorGrama;
  }, 0);

  const custoOverhead = custoIngredientes * (taxaOverhead / 100);

  const custoEmbalagens = linhasEmbalagens.reduce((soma, linha) => {
    const embalagem = linha.embalagemId ? mapaEmbalagens.get(linha.embalagemId) : null;
    if (!embalagem) return soma;
    return soma + linha.quantidade * embalagem.custoUnitario;
  }, 0);

  const custoTotal = custoIngredientes + custoOverhead + custoEmbalagens;
  const custoPorUnidade = rendimento > 0 ? custoTotal / rendimento : 0;
  const lucroPorUnidade = precoVenda - custoPorUnidade;
  const margemPercentual = precoVenda > 0 ? (lucroPorUnidade / precoVenda) * 100 : 0;
  const lucroTotal = lucroPorUnidade * rendimento;
  const precoVendaTotal = precoVenda * rendimento;

  function atualizarLinhaIngrediente(chave: string, dados: Partial<LinhaIngrediente>) {
    setLinhasIngredientes((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...dados } : l)));
  }

  function atualizarLinhaEmbalagem(chave: string, dados: Partial<LinhaEmbalagem>) {
    setLinhasEmbalagens((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...dados } : l)));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Cartao titulo="Ingredientes usados na receita (total do lote)">
          <div className="space-y-3">
            {linhasIngredientes.map((linha) => {
              const ingrediente = linha.ingredienteId ? mapaIngredientes.get(linha.ingredienteId) : null;
              const custoLinha = ingrediente ? linha.gramas * ingrediente.precoPorGrama : 0;
              return (
                <div key={linha.chave} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
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
                  </div>
                  <Campo
                    rotulo="Gramas"
                    type="number"
                    step="any"
                    className="w-full sm:w-28"
                    value={linha.gramas || ""}
                    onChange={(e) => atualizarLinhaIngrediente(linha.chave, { gramas: Number(e.target.value) || 0 })}
                  />
                  <div className="whitespace-nowrap pb-2 text-sm font-bold text-terracota-vibrante sm:w-24">
                    R$ {custoLinha.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinhasIngredientes((atual) => atual.filter((l) => l.chave !== linha.chave))}
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
              setLinhasIngredientes((atual) => [...atual, { chave: novaChave(), ingredienteId: null, gramas: 0 }])
            }
          >
            + Adicionar ingrediente
          </Botao>
        </Cartao>

        <Cartao titulo="Embalagens usadas (total do lote)">
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
      </div>

      <div className="space-y-6">
        <Cartao titulo="Contas finais">
          <div className="grid grid-cols-2 gap-3">
            <Campo
              rotulo="Utilidades (%) — gás, luz, etc."
              type="number"
              step="any"
              value={taxaOverhead}
              onChange={(e) => setTaxaOverhead(Number(e.target.value) || 0)}
            />
            <Campo
              rotulo="Rendimento (quantas unidades)"
              type="number"
              step="any"
              value={rendimento}
              onChange={(e) => setRendimento(Number(e.target.value) || 0)}
            />
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="text-texto-suave">Custo dos ingredientes: </span>
              <strong className="text-texto">R$ {custoIngredientes.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">+ Utilidades ({taxaOverhead}%): </span>
              <strong className="text-texto">R$ {custoOverhead.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">+ Embalagens: </span>
              <strong className="text-texto">R$ {custoEmbalagens.toFixed(2)}</strong>
            </p>
            <p className="pt-1">
              <span className="text-texto-suave">Custo total do lote: </span>
              <strong className="text-terracota-vibrante">R$ {custoTotal.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">Custo por unidade: </span>
              <strong className="text-terracota-vibrante">R$ {custoPorUnidade.toFixed(2)}</strong>
            </p>
          </div>
        </Cartao>

        <Cartao titulo="Preço de venda sugerido">
          <Campo
            rotulo="Preço de venda por unidade"
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
              <span className="text-texto-suave">Preço de venda do lote inteiro: </span>
              <strong className="text-texto">R$ {precoVendaTotal.toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-texto-suave">Lucro líquido do lote inteiro: </span>
              <strong className={lucroTotal >= 0 ? "text-salvia" : "text-alerta"}>R$ {lucroTotal.toFixed(2)}</strong>
            </p>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
