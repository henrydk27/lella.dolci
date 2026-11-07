import Link from "next/link";
import * as financeiro from "@/lib/financeiro";
import { Cartao } from "@/components/ui/Cartao";
import { CampoSelect } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, TabelaVazia } from "@/components/ui/Tabela";
import { fecharMesAction } from "./actions";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dataBr(iso: string) {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

// tipo "lucro" sempre em verde (salvia) e "gasto" sempre em vermelho
// (alerta), em qualquer card da tela - pra nunca ter duvida visual sobre o
// que e' dinheiro ganho e o que e' dinheiro gasto.
function Linha({
  rotulo,
  valor,
  tipo = "neutro",
  destaque,
}: {
  rotulo: string;
  valor: string;
  tipo?: "lucro" | "gasto" | "neutro";
  destaque?: boolean;
}) {
  const cor =
    tipo === "lucro" ? "text-salvia" : tipo === "gasto" ? "text-alerta" : destaque ? "text-terracota-vibrante" : "text-texto";
  return (
    <p className="flex items-center justify-between text-sm">
      <span className="text-texto-suave">{rotulo}</span>
      <strong className={cor}>{valor}</strong>
    </p>
  );
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const hoje = new Date();
  const ano = Number(sp.ano) || hoje.getFullYear();
  const mes = Number(sp.mes) || hoje.getMonth() + 1;

  const ultimoDia = new Date(ano, mes, 0).getDate();
  const inicio = `${ano}-${pad(mes)}-01`;
  const fim = `${ano}-${pad(mes)}-${pad(ultimoDia)}`;

  const fechamento = await financeiro.buscarFechamento(ano, mes);

  const resumo = fechamento
    ? {
        faturamento: fechamento.faturamento,
        custoProdutos: fechamento.custoProdutos,
        custoOverhead: fechamento.taxaGasLuzAgua,
        lucroGerado: fechamento.lucroGerado,
        quantidadePedidos: 0,
      }
    : await financeiro.resumoPeriodo(inicio, fim, undefined, true);

  const distribuicao = fechamento
    ? (() => {
        const lucroDisponivel = fechamento.reservaFinanceira + fechamento.funcionariaMae + fechamento.proprietaria;
        return {
          recebido: fechamento.recebido,
          reservaDespesas: fechamento.reservaDespesas,
          lucroDisponivel,
          reservaFinanceira: fechamento.reservaFinanceira,
          funcionariaMae: fechamento.funcionariaMae,
          proprietaria: fechamento.proprietaria,
          lucroRecebido: lucroDisponivel + fechamento.reservaDespesas,
          custoIngredientesRecebido: fechamento.reservaDespesas / financeiro.PERCENTUAL_RESERVA_DESPESAS,
        };
      })()
    : await financeiro.distribuicaoDinheiroRecebido(inicio, fim);

  const pendenteDoMes = await financeiro.pendenteDoPeriodoDeVenda(inicio, fim);
  const pendenteGeral = fechamento ? fechamento.pendente : await financeiro.pendenteGeral();

  const resumoAno = await financeiro.resumoAno(ano);

  const atrasados = await financeiro.pedidosComSaldoPendente();
  const fechamentos = await financeiro.listarFechamentos();

  const anosDisponiveis = Array.from({ length: 6 }, (_, i) => hoje.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Financeiro</h2>
          <p className="text-sm text-texto-suave">
            Quanto a confeitaria gerou, quanto recebeu de verdade e quanto pode separar para cada finalidade.
          </p>
        </div>
        <Link href="/" className="text-sm font-bold text-terracota hover:underline">
          Início
        </Link>
      </div>

      <Cartao>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <CampoSelect
            rotulo="Mês"
            name="mes"
            defaultValue={String(mes)}
            opcoes={MESES.map((m, i) => ({ valor: String(i + 1), texto: m }))}
          />
          <CampoSelect
            rotulo="Ano"
            name="ano"
            defaultValue={String(ano)}
            opcoes={anosDisponiveis.map((a) => ({ valor: String(a), texto: String(a) }))}
          />
          <button type="submit" className="rounded-full bg-terracota px-5 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover">
            Ver mês
          </button>
        </form>
        <div className="mt-3">
          {fechamento ? (
            <span className="rounded-full border border-salvia bg-salvia/10 px-4 py-2 text-sm font-bold text-salvia">
              Mês fechado em {dataBr(fechamento.fechadoEm)}
            </span>
          ) : (
            <form action={fecharMesAction}>
              <input type="hidden" name="ano" value={ano} />
              <input type="hidden" name="mes" value={mes} />
              <Botao type="submit" variante="fantasma">
                Fechar este mês
              </Botao>
            </form>
          )}
        </div>
      </Cartao>

      <div>
        <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">{MESES[mes - 1]} de {ano}</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Cartao titulo="Vendas do mês">
            <p className="mb-3 text-xs text-texto-suave">
              Resultado dos pedidos de {MESES[mes - 1]} já marcados como pagos.
            </p>
            <div className="space-y-1.5">
              <Linha rotulo="Faturamento" valor={`R$ ${resumo.faturamento.toFixed(2)}`} />
              <Linha
                rotulo="Custo de ingredientes e embalagens"
                valor={`R$ ${resumo.custoProdutos.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha rotulo="Lucro gerado" valor={`R$ ${resumo.lucroGerado.toFixed(2)}`} tipo="lucro" destaque />
            </div>
          </Cartao>

          <Cartao titulo="Taxa gás/luz/água">
            <p className="mb-3 text-xs text-texto-suave">
              Parte do custo dos pedidos de {MESES[mes - 1]} já pagos reservada pra gás, luz e água (definida em cada
              receita ou produto).
            </p>
            <div className="space-y-1.5">
              <Linha rotulo="Gasto com gás/luz/água no mês" valor={`R$ ${resumo.custoOverhead.toFixed(2)}`} tipo="gasto" destaque />
            </div>
          </Cartao>

          <Cartao titulo="Dinheiro recebido">
            <p className="mb-3 text-xs text-texto-suave">
              Valores que entraram de verdade em {MESES[mes - 1]} (pela data do pagamento, não da venda).
            </p>
            <div className="space-y-1.5">
              <Linha rotulo="Recebido no mês" valor={`R$ ${distribuicao.recebido.toFixed(2)}`} destaque />
              <Linha
                rotulo="Custo correspondente já recebido"
                valor={`R$ ${distribuicao.custoIngredientesRecebido.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha rotulo="Lucro recebido" valor={`R$ ${distribuicao.lucroRecebido.toFixed(2)}`} tipo="lucro" />
              <Linha
                rotulo="Reserva de despesas (10% do custo recebido)"
                valor={`R$ ${distribuicao.reservaDespesas.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha
                rotulo="Lucro disponível p/ distribuir"
                valor={`R$ ${distribuicao.lucroDisponivel.toFixed(2)}`}
                tipo="lucro"
                destaque
              />
            </div>
          </Cartao>

          <Cartao titulo="Pendente">
            <p className="mb-3 text-xs text-texto-suave">Valores ainda não recebidos, inclusive parciais.</p>
            <div className="space-y-1.5">
              <Linha rotulo="Vendas deste mês ainda não recebidas" valor={`R$ ${Math.max(pendenteDoMes, 0).toFixed(2)}`} />
              <Linha
                rotulo="Saldo pendente total (todos os meses)"
                valor={`R$ ${Math.max(pendenteGeral, 0).toFixed(2)}`}
                destaque
              />
            </div>
          </Cartao>
        </div>

        <Cartao titulo="Distribuição do lucro disponível do mês" className="mt-6">
          <p className="mb-3 text-sm text-texto-suave">
            Calculada sobre o lucro já recebido em dinheiro (depois de separar a reserva de despesas) — nunca sobre o
            faturamento.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Reserva financeira (8%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {distribuicao.reservaFinanceira.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Funcionária mãe (15%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {distribuicao.funcionariaMae.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Proprietária / reinvestimento (77%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {distribuicao.proprietaria.toFixed(2)}</p>
            </div>
          </div>
        </Cartao>
      </div>

      <div>
        <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">Ano {ano} (geral)</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Cartao titulo="Vendas do ano">
            <p className="mb-3 text-xs text-texto-suave">
              Resultado dos pedidos de {ano} já marcados como pagos — soma dos 12 meses.
            </p>
            <div className="space-y-1.5">
              <Linha rotulo="Faturamento" valor={`R$ ${resumoAno.faturamento.toFixed(2)}`} />
              <Linha
                rotulo="Custo de ingredientes e embalagens"
                valor={`R$ ${resumoAno.custoProdutos.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha rotulo="Lucro gerado" valor={`R$ ${resumoAno.lucroGerado.toFixed(2)}`} tipo="lucro" destaque />
            </div>
          </Cartao>

          <Cartao titulo="Taxa gás/luz/água no ano">
            <p className="mb-3 text-xs text-texto-suave">
              Parte do custo dos pedidos de {ano} já pagos reservada pra gás, luz e água — soma dos 12 meses.
            </p>
            <div className="space-y-1.5">
              <Linha
                rotulo="Gasto com gás/luz/água no ano"
                valor={`R$ ${resumoAno.custoOverhead.toFixed(2)}`}
                tipo="gasto"
                destaque
              />
            </div>
          </Cartao>

          <Cartao titulo="Dinheiro recebido no ano">
            <p className="mb-3 text-xs text-texto-suave">
              Valores que entraram de verdade em {ano} (pela data do pagamento, não da venda).
            </p>
            <div className="space-y-1.5">
              <Linha rotulo="Recebido no ano" valor={`R$ ${resumoAno.recebido.toFixed(2)}`} destaque />
              <Linha
                rotulo="Custo correspondente já recebido"
                valor={`R$ ${resumoAno.custoIngredientesRecebido.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha rotulo="Lucro recebido" valor={`R$ ${resumoAno.lucroRecebido.toFixed(2)}`} tipo="lucro" />
              <Linha
                rotulo="Reserva de despesas (10% do custo recebido)"
                valor={`R$ ${resumoAno.reservaDespesas.toFixed(2)}`}
                tipo="gasto"
              />
              <Linha
                rotulo="Lucro disponível p/ distribuir"
                valor={`R$ ${resumoAno.lucroDisponivel.toFixed(2)}`}
                tipo="lucro"
                destaque
              />
            </div>
          </Cartao>

          <Cartao titulo="Pendente no ano">
            <p className="mb-3 text-xs text-texto-suave">Vendas de {ano} ainda não recebidas, inclusive parciais.</p>
            <div className="space-y-1.5">
              <Linha rotulo="Vendas deste ano ainda não recebidas" valor={`R$ ${Math.max(resumoAno.pendenteDoAno, 0).toFixed(2)}`} />
              <Linha
                rotulo="Saldo pendente total (todos os anos)"
                valor={`R$ ${Math.max(pendenteGeral, 0).toFixed(2)}`}
                destaque
              />
            </div>
          </Cartao>
        </div>

        <Cartao titulo="Distribuição do lucro disponível do ano" className="mt-6">
          <p className="mb-3 text-sm text-texto-suave">
            Mesmo calculo de cima, somado para o ano inteiro.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Reserva financeira (8%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {resumoAno.reservaFinanceira.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Funcionária mãe (15%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {resumoAno.funcionariaMae.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-painel-claro p-4">
              <p className="text-xs font-bold uppercase text-texto-suave">Proprietária / reinvestimento (77%)</p>
              <p className="font-titulo text-xl text-salvia">R$ {resumoAno.proprietaria.toFixed(2)}</p>
            </div>
          </div>
        </Cartao>
      </div>

      <Cartao titulo="Recebimentos atrasados">
        <p className="mb-3 text-sm text-texto-suave">
          Pedidos com saldo ainda não recebido — a venda mantém a data original, mas o pagamento só entra no fluxo de
          caixa quando for de fato registrado.
        </p>
        <Tabela>
          <TabelaCabecalho colunas={["Pedido", "Cliente", "Data da venda", "Total", "Recebido", "Pendente", ""]} />
          <tbody>
            {atrasados.length === 0 && <TabelaVazia colunas={7} texto="Nenhum pedido com saldo pendente." />}
            {atrasados.map((p) => (
              <TabelaLinha key={p.id}>
                <TabelaCelula>#{p.id}</TabelaCelula>
                <TabelaCelula>{p.clienteNome ?? "-"}</TabelaCelula>
                <TabelaCelula>{dataBr(p.dataPedido)}</TabelaCelula>
                <TabelaCelula>R$ {p.total.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {p.recebido.toFixed(2)}</TabelaCelula>
                <TabelaCelula>
                  <strong className="text-alerta">R$ {p.pendente.toFixed(2)}</strong>
                </TabelaCelula>
                <TabelaCelula>
                  <Link href={`/pedidos/${p.id}`} className="font-bold text-terracota hover:underline">
                    Registrar pagamento
                  </Link>
                </TabelaCelula>
              </TabelaLinha>
            ))}
          </tbody>
        </Tabela>
      </Cartao>

      <Cartao titulo="Fechamentos anteriores">
        <Tabela>
          <TabelaCabecalho
            colunas={["Mês", "Faturamento", "Lucro gerado", "Recebido", "Pendente", "Reserva financeira", "Mãe", "Proprietária"]}
          />
          <tbody>
            {fechamentos.length === 0 && <TabelaVazia colunas={8} texto="Nenhum mês fechado ainda." />}
            {fechamentos.map((f) => (
              <TabelaLinha key={f.id}>
                <TabelaCelula>
                  <Link href={`/financeiro?ano=${f.ano}&mes=${f.mes}`} className="font-bold text-terracota hover:underline">
                    {MESES[f.mes - 1]}/{f.ano}
                  </Link>
                </TabelaCelula>
                <TabelaCelula>R$ {f.faturamento.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.lucroGerado.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.recebido.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.pendente.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.reservaFinanceira.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.funcionariaMae.toFixed(2)}</TabelaCelula>
                <TabelaCelula>R$ {f.proprietaria.toFixed(2)}</TabelaCelula>
              </TabelaLinha>
            ))}
          </tbody>
        </Tabela>
      </Cartao>
    </div>
  );
}
