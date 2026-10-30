import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  clientes,
  produtos,
  ingredientes,
  embalagens,
  pedidos,
  pedidoItens,
  produtoIngredientes,
  produtoEmbalagens,
  planoProducaoItens,
  gastos,
} from "@/db/schema";

function adicionarAba<T extends Record<string, unknown>>(
  workbook: ExcelJS.Workbook,
  nomeAba: string,
  colunas: { chave: keyof T; titulo: string; largura?: number }[],
  linhas: T[]
) {
  const aba = workbook.addWorksheet(nomeAba);
  aba.columns = colunas.map((c) => ({ header: c.titulo, key: String(c.chave), width: c.largura ?? 20 }));
  aba.getRow(1).font = { bold: true };
  for (const linha of linhas) {
    aba.addRow(linha);
  }
}

// Gera uma planilha com todos os dados atuais do sistema, uma aba por
// tabela, para o usuario guardar como backup fora do banco de dados.
export async function gerarPlanilhaBackup(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lella Dolci - Controle de Vendas";
  workbook.created = new Date();

  const todosClientes = await db.select().from(clientes);
  adicionarAba(
    workbook,
    "Clientes",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "nome", titulo: "Nome", largura: 28 },
      { chave: "telefone", titulo: "Telefone", largura: 16 },
      { chave: "email", titulo: "E-mail", largura: 24 },
      { chave: "endereco", titulo: "Endereço", largura: 28 },
      { chave: "aniversario", titulo: "Aniversário", largura: 14 },
      { chave: "comoConheceu", titulo: "Como conheceu", largura: 20 },
      { chave: "notas", titulo: "Notas", largura: 30 },
    ],
    todosClientes
  );

  const todosProdutos = await db.select().from(produtos);
  adicionarAba(
    workbook,
    "Produtos",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "nome", titulo: "Nome", largura: 30 },
      { chave: "categoria", titulo: "Categoria", largura: 18 },
      { chave: "preco", titulo: "Preço de venda", largura: 14 },
      { chave: "taxaOverhead", titulo: "Taxa utilidades (%)", largura: 16 },
      { chave: "estoqueProduzido", titulo: "Estoque pronto", largura: 14 },
      { chave: "descricao", titulo: "Descrição", largura: 30 },
    ],
    todosProdutos
  );

  const todosIngredientes = await db.select().from(ingredientes);
  adicionarAba(
    workbook,
    "Ingredientes",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "nome", titulo: "Nome", largura: 30 },
      { chave: "quantidadeEstoque", titulo: "Estoque", largura: 12 },
      { chave: "gramasPorEmbalagem", titulo: "Peso do produto (g)", largura: 18 },
      { chave: "precoEmbalagem", titulo: "Preço do produto", largura: 16 },
      { chave: "precoUnitario", titulo: "Preço por grama", largura: 16 },
    ],
    todosIngredientes
  );

  const todasEmbalagens = await db.select().from(embalagens);
  adicionarAba(
    workbook,
    "Embalagens",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "nome", titulo: "Nome", largura: 30 },
      { chave: "categoria", titulo: "Categoria", largura: 16 },
      { chave: "custoTotal", titulo: "Custo total", largura: 14 },
      { chave: "rendimento", titulo: "Rendimento", largura: 12 },
      { chave: "observacoes", titulo: "Observações", largura: 30 },
    ],
    todasEmbalagens
  );

  const linhasPlanejador = await db
    .select({
      id: planoProducaoItens.id,
      data: planoProducaoItens.data,
      produtoNome: produtos.nome,
      quantidadePlanejada: planoProducaoItens.quantidadePlanejada,
      ordem: planoProducaoItens.ordem,
      concluido: planoProducaoItens.concluido,
      quantidadeProduzida: planoProducaoItens.quantidadeProduzida,
    })
    .from(planoProducaoItens)
    .innerJoin(produtos, eq(produtos.id, planoProducaoItens.produtoId));
  adicionarAba(
    workbook,
    "Planejador",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "data", titulo: "Data", largura: 14 },
      { chave: "produtoNome", titulo: "Produto", largura: 30 },
      { chave: "quantidadePlanejada", titulo: "Quantidade planejada", largura: 18 },
      { chave: "ordem", titulo: "Ordem", largura: 10 },
      { chave: "concluido", titulo: "Concluído", largura: 12 },
      { chave: "quantidadeProduzida", titulo: "Quantidade produzida", largura: 18 },
    ],
    linhasPlanejador
  );

  const linhasPedidos = await db
    .select({
      id: pedidos.id,
      clienteNome: clientes.nome,
      tipo: pedidos.tipo,
      dataPedido: pedidos.dataPedido,
      dataEntrega: pedidos.dataEntrega,
      formaPagamento: pedidos.formaPagamento,
      status: pedidos.status,
      caixa: pedidos.caixa,
      taxaEntrega: pedidos.taxaEntrega,
      observacoes: pedidos.observacoes,
    })
    .from(pedidos)
    .leftJoin(clientes, eq(clientes.id, pedidos.clienteId));
  adicionarAba(
    workbook,
    "Pedidos",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "clienteNome", titulo: "Cliente", largura: 24 },
      { chave: "tipo", titulo: "Tipo", largura: 14 },
      { chave: "dataPedido", titulo: "Data do pedido", largura: 18 },
      { chave: "dataEntrega", titulo: "Data de entrega", largura: 14 },
      { chave: "formaPagamento", titulo: "Pagamento", largura: 14 },
      { chave: "status", titulo: "Status", largura: 12 },
      { chave: "caixa", titulo: "Caixa", largura: 16 },
      { chave: "taxaEntrega", titulo: "Taxa de entrega", largura: 14 },
      { chave: "observacoes", titulo: "Observações", largura: 30 },
    ],
    linhasPedidos
  );

  const linhasItens = await db
    .select({
      pedidoId: pedidoItens.pedidoId,
      produtoNome: produtos.nome,
      quantidade: pedidoItens.quantidade,
      precoUnitario: pedidoItens.precoUnitario,
    })
    .from(pedidoItens)
    .innerJoin(produtos, eq(produtos.id, pedidoItens.produtoId));
  adicionarAba(
    workbook,
    "Itens dos Pedidos",
    [
      { chave: "pedidoId", titulo: "Pedido ID", largura: 10 },
      { chave: "produtoNome", titulo: "Produto", largura: 30 },
      { chave: "quantidade", titulo: "Quantidade", largura: 12 },
      { chave: "precoUnitario", titulo: "Preço unitário", largura: 14 },
    ],
    linhasItens
  );

  const linhasReceitas = await db
    .select({
      produtoNome: produtos.nome,
      ingredienteNome: ingredientes.nome,
      quantidade: produtoIngredientes.quantidade,
    })
    .from(produtoIngredientes)
    .innerJoin(produtos, eq(produtos.id, produtoIngredientes.produtoId))
    .innerJoin(ingredientes, eq(ingredientes.id, produtoIngredientes.ingredienteId));
  adicionarAba(
    workbook,
    "Receitas (Ingredientes)",
    [
      { chave: "produtoNome", titulo: "Produto", largura: 30 },
      { chave: "ingredienteNome", titulo: "Ingrediente", largura: 30 },
      { chave: "quantidade", titulo: "Quantidade (g)", largura: 14 },
    ],
    linhasReceitas
  );

  const linhasReceitasEmbalagens = await db
    .select({
      produtoNome: produtos.nome,
      embalagemNome: embalagens.nome,
      quantidade: produtoEmbalagens.quantidade,
    })
    .from(produtoEmbalagens)
    .innerJoin(produtos, eq(produtos.id, produtoEmbalagens.produtoId))
    .innerJoin(embalagens, eq(embalagens.id, produtoEmbalagens.embalagemId));
  adicionarAba(
    workbook,
    "Receitas (Embalagens)",
    [
      { chave: "produtoNome", titulo: "Produto", largura: 30 },
      { chave: "embalagemNome", titulo: "Embalagem", largura: 30 },
      { chave: "quantidade", titulo: "Quantidade", largura: 12 },
    ],
    linhasReceitasEmbalagens
  );

  const todosGastos = await db.select().from(gastos);
  adicionarAba(
    workbook,
    "Gastos",
    [
      { chave: "id", titulo: "ID", largura: 8 },
      { chave: "nome", titulo: "Nome", largura: 28 },
      { chave: "data", titulo: "Data", largura: 14 },
      { chave: "tipoPagamento", titulo: "Pagamento", largura: 14 },
      { chave: "categoria", titulo: "Categoria", largura: 18 },
      { chave: "valor", titulo: "Valor", largura: 14 },
    ],
    todosGastos
  );

  return workbook.xlsx.writeBuffer();
}
