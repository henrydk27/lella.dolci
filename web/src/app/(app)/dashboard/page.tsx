import Link from "next/link";
import * as financeiro from "@/lib/financeiro";
import * as produtosLib from "@/lib/produtos";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { GraficoPizza, GraficoBarrasDuplas, GraficoBarrasSimples } from "@/components/ui/Graficos";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CartaoIndicador({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <Cartao titulo={titulo}>
      <p className="font-titulo text-2xl text-texto">{valor}</p>
      {detalhe && <p className="mt-1 text-sm text-texto-suave">{detalhe}</p>}
    </Cartao>
  );
}

interface Filtros {
  ano: number;
  mes: number | null; // null = ano inteiro
  inicio?: string;
  fim?: string;
  categoria?: string;
  pagamento?: string; // todos | pago | pendente
}

function limitesDoPeriodo(f: Filtros): { inicio: string; fim: string } {
  if (f.inicio && f.fim) return { inicio: f.inicio, fim: f.fim };
  if (f.mes) {
    const ultimoDia = new Date(f.ano, f.mes, 0).getDate();
    return { inicio: `${f.ano}-${pad(f.mes)}-01`, fim: `${f.ano}-${pad(f.mes)}-${pad(ultimoDia)}` };
  }
  return { inicio: `${f.ano}-01-01`, fim: `${f.ano}-12-31` };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; inicio?: string; fim?: string; categoria?: string; pagamento?: string }>;
}) {
  const sp = await searchParams;
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const periodoPersonalizado = Boolean(sp.inicio && sp.fim);
  const filtros: Filtros = {
    ano: Number(sp.ano) || anoAtual,
    mes: periodoPersonalizado ? null : sp.mes !== undefined ? (sp.mes ? Number(sp.mes) : null) : mesAtual,
    inicio: sp.inicio || undefined,
    fim: sp.fim || undefined,
    categoria: sp.categoria || undefined,
    pagamento: sp.pagamento || "todos",
  };

  const { inicio, fim } = limitesDoPeriodo(filtros);

  const linhas = await financeiro.buscarLinhasPeriodo(inicio, fim);
  const taxaPorPedido = await financeiro.mapaTaxaEntregaPorPedido(inicio, fim);

  const linhasFiltradas = linhas.filter((l) => {
    if (filtros.categoria && l.categoria !== filtros.categoria) return false;
    if (filtros.pagamento === "pago" && l.status !== "pago") return false;
    if (filtros.pagamento === "pendente" && l.status === "pago") return false;
    return true;
  });

  const custoMapa = await financeiro.mapaCustoIngredientesEmbalagens(linhasFiltradas.map((l) => l.produtoId));

  const pedidoIdsFiltrados = new Set(linhasFiltradas.map((l) => l.pedidoId));
  const faturamentoItens = linhasFiltradas.reduce((s, l) => s + l.quantidade * l.precoUnitario, 0);
  const taxaEntregaTotal = Array.from(pedidoIdsFiltrados).reduce((s, id) => s + (taxaPorPedido.get(id) ?? 0), 0);
  const faturamento = faturamentoItens + taxaEntregaTotal;
  const custoProdutos = linhasFiltradas.reduce((s, l) => s + (custoMapa.get(l.produtoId)?.total ?? 0) * l.quantidade, 0);
  const lucroGerado = faturamento - custoProdutos;
  const quantidadeEncomendas = new Set(
    linhasFiltradas.filter((l) => l.tipo === "encomenda").map((l) => l.pedidoId)
  ).size;

  // Faturamento anual (sempre o ano inteiro selecionado, sem os filtros de categoria/pagamento).
  const limitesAno = limitesDoPeriodo({ ...filtros, mes: null, inicio: undefined, fim: undefined });
  const resumoAnual = await financeiro.resumoPeriodo(limitesAno.inicio, limitesAno.fim);

  const recebidoNoPeriodo = (await financeiro.distribuicaoDinheiroRecebido(inicio, fim)).recebido;
  const pendenteGeralValor = await financeiro.pendenteGeral();

  // Acompanhamento: contagem por status de producao/entrega (sem filtro de categoria/pagamento).
  const contagemStatus = { pendente: 0, pronto: 0, entregue: 0 };
  const pedidosUnicos = new Map<number, { status: string }>();
  for (const l of linhas) pedidosUnicos.set(l.pedidoId, { status: l.status });
  for (const p of pedidosUnicos.values()) {
    if (p.status === "pendente") contagemStatus.pendente++;
    else if (p.status === "pronto") contagemStatus.pronto++;
    else if (p.status === "entregue") contagemStatus.entregue++;
  }

  // Grafico: faturamento e lucro nos ultimos 6 meses (terminando no mes/ano filtrado).
  const mesReferencia = filtros.mes ?? mesAtual;
  const anoReferencia = filtros.ano;
  const tendencia = [];
  for (let i = 5; i >= 0; i--) {
    const data = new Date(anoReferencia, mesReferencia - 1 - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;
    const { inicio: ini, fim: f } = limitesDoPeriodo({ ano, mes, categoria: undefined, pagamento: "todos" });
    const resumoMes = await financeiro.resumoPeriodo(ini, f);
    tendencia.push({ rotulo: `${MESES[mes - 1].slice(0, 3)}/${String(ano).slice(2)}`, a: resumoMes.faturamento, b: resumoMes.lucroGerado });
  }

  // Comparativo mes a mes (mes selecionado vs mes anterior), sempre que um mes especifico estiver selecionado.
  let comparativo: { atual: number; anterior: number; variacao: number } | null = null;
  if (filtros.mes && !periodoPersonalizado) {
    const dataAnterior = new Date(filtros.ano, filtros.mes - 2, 1);
    const { inicio: iniAnt, fim: fimAnt } = limitesDoPeriodo({
      ano: dataAnterior.getFullYear(),
      mes: dataAnterior.getMonth() + 1,
    });
    const resumoAnterior = await financeiro.resumoPeriodo(iniAnt, fimAnt);
    const variacao = resumoAnterior.faturamento > 0 ? ((faturamento - resumoAnterior.faturamento) / resumoAnterior.faturamento) * 100 : 0;
    comparativo = { atual: faturamento, anterior: resumoAnterior.faturamento, variacao };
  }

  // Grafico de pizza: faturamento por categoria (% do faturamento, nao quantidade).
  const porCategoria = new Map<string, number>();
  for (const l of linhasFiltradas) {
    porCategoria.set(l.categoria, (porCategoria.get(l.categoria) ?? 0) + l.quantidade * l.precoUnitario);
  }
  const dadosPizza = Array.from(porCategoria.entries())
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Produtos mais vendidos (quantidade).
  const porProduto = new Map<string, number>();
  for (const l of linhasFiltradas) {
    porProduto.set(l.produtoNome, (porProduto.get(l.produtoNome) ?? 0) + l.quantidade);
  }
  const maisVendidos = Array.from(porProduto.entries())
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  const categorias = await produtosLib.listarCategorias();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-titulo text-xl text-terracota-vibrante">Dashboard</h2>
          <p className="text-sm text-texto-suave">
            Período: {inicio.split("-").reverse().join("/")} até {fim.split("-").reverse().join("/")}
          </p>
        </div>
        <Link href="/" className="text-sm font-bold text-terracota hover:underline">
          Início
        </Link>
      </div>

      <Cartao titulo="Filtros">
        <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CampoSelect
            rotulo="Mês"
            name="mes"
            defaultValue={filtros.mes ? String(filtros.mes) : ""}
            opcoes={[{ valor: "", texto: "Ano inteiro" }, ...MESES.map((m, i) => ({ valor: String(i + 1), texto: m }))]}
          />
          <Campo rotulo="Ano" name="ano" type="number" defaultValue={filtros.ano} />
          <CampoSelect
            rotulo="Categoria"
            name="categoria"
            defaultValue={filtros.categoria ?? ""}
            opcoes={[{ valor: "", texto: "Todas" }, ...categorias.map((c) => ({ valor: c, texto: c }))]}
          />
          <CampoSelect
            rotulo="Situação do pagamento"
            name="pagamento"
            defaultValue={filtros.pagamento ?? "todos"}
            opcoes={[
              { valor: "todos", texto: "Todos" },
              { valor: "pago", texto: "Pago" },
              { valor: "pendente", texto: "Pendente" },
            ]}
          />
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-4 sm:flex sm:items-end">
            <Campo rotulo="Período personalizado — início" name="inicio" type="date" defaultValue={filtros.inicio ?? ""} />
            <Campo rotulo="até" name="fim" type="date" defaultValue={filtros.fim ?? ""} />
            <button
              type="submit"
              className="col-span-2 rounded-full bg-terracota px-5 py-2 text-sm font-bold text-[#FFF9F0] hover:bg-terracota-hover sm:col-span-1"
            >
              Aplicar
            </button>
          </div>
        </form>
      </Cartao>

      <div>
        <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">Indicadores</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CartaoIndicador titulo="Faturamento do período" valor={`R$ ${faturamento.toFixed(2)}`} detalhe="vendas realizadas, pagas ou não" />
          <CartaoIndicador titulo={`Faturamento anual (${limitesAno.inicio.slice(0, 4)})`} valor={`R$ ${resumoAnual.faturamento.toFixed(2)}`} />
          <CartaoIndicador titulo="Lucro do período" valor={`R$ ${lucroGerado.toFixed(2)}`} detalhe="faturamento menos custo de ingredientes e embalagens" />
          <CartaoIndicador titulo="Encomendas no período" valor={String(quantidadeEncomendas)} />
          <CartaoIndicador titulo="Valores efetivamente recebidos" valor={`R$ ${recebidoNoPeriodo.toFixed(2)}`} detalhe="dinheiro que entrou no período" />
          <CartaoIndicador titulo="Pagamentos pendentes (total)" valor={`R$ ${Math.max(pendenteGeralValor, 0).toFixed(2)}`} detalhe="saldo em aberto de todos os pedidos" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cartao titulo="Faturamento e lucro ao longo dos meses">
          <GraficoBarrasDuplas dados={tendencia} rotuloA="Faturamento" rotuloB="Lucro" />
        </Cartao>
        <Cartao titulo="Faturamento por categoria">
          <GraficoPizza dados={dadosPizza} />
        </Cartao>
        <Cartao titulo="Produtos mais vendidos (quantidade)">
          <GraficoBarrasSimples dados={maisVendidos} />
        </Cartao>
        <Cartao titulo="Comparativo com o mês anterior">
          {comparativo ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-texto-suave">Este mês: </span>
                <strong className="text-texto">R$ {comparativo.atual.toFixed(2)}</strong>
              </p>
              <p>
                <span className="text-texto-suave">Mês anterior: </span>
                <strong className="text-texto">R$ {comparativo.anterior.toFixed(2)}</strong>
              </p>
              <p className="pt-1">
                <span className="text-texto-suave">Variação: </span>
                <strong className={comparativo.variacao >= 0 ? "text-salvia" : "text-alerta"}>
                  {comparativo.variacao >= 0 ? "+" : ""}
                  {comparativo.variacao.toFixed(1)}%
                </strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-texto-suave">Selecione um mês específico para comparar com o anterior.</p>
          )}
        </Cartao>
      </div>

      <div>
        <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">Acompanhamento</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <CartaoIndicador titulo="Aguardando preparo" valor={String(contagemStatus.pendente)} />
          <CartaoIndicador titulo="Prontas para entrega" valor={String(contagemStatus.pronto)} />
          <CartaoIndicador titulo="Entregues" valor={String(contagemStatus.entregue)} />
          <CartaoIndicador titulo="Pagamentos pendentes" valor={`R$ ${Math.max(pendenteGeralValor, 0).toFixed(2)}`} />
        </div>
      </div>
    </div>
  );
}
