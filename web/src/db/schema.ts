import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const ingredientes = sqliteTable("ingredientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull().unique(),
  unidade: text("unidade").notNull(),
  quantidadeEstoque: real("quantidade_estoque").notNull().default(0),
  // O que o usuario realmente sabe na hora da compra: tamanho e preco da
  // embalagem. O preco por grama (precoUnitario) e sempre calculado a partir
  // desses dois, nunca digitado direto.
  gramasPorEmbalagem: real("gramas_por_embalagem").notNull().default(0),
  precoEmbalagem: real("preco_embalagem").notNull().default(0),
  precoUnitario: real("preco_unitario").notNull().default(0),
});

export const embalagens = sqliteTable("embalagens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull().unique(),
  categoria: text("categoria"),
  custoTotal: real("custo_total").notNull().default(0),
  rendimento: integer("rendimento").notNull().default(1),
  observacoes: text("observacoes"),
});

export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull().unique(),
  preco: real("preco").notNull(),
  descricao: text("descricao"),
  categoria: text("categoria"),
  taxaOverhead: real("taxa_overhead").notNull().default(10),
  // Estoque de produto ja pronto (producao concluida no planejador), separado
  // do estoque de ingredientes (materia-prima).
  estoqueProduzido: real("estoque_produzido").notNull().default(0),
  // Marca os produtos que podem ser escolhidos como sabor ao montar uma caixa
  // fechada (brigadeiro, beijinho, cajuzinho etc) na tela de novo pedido.
  disponivelNaCaixa: integer("disponivel_na_caixa", { mode: "boolean" }).notNull().default(false),
});

export const produtoIngredientes = sqliteTable("produto_ingredientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  ingredienteId: integer("ingrediente_id").notNull().references(() => ingredientes.id, { onDelete: "cascade" }),
  quantidade: real("quantidade").notNull(),
});

export const produtoEmbalagens = sqliteTable("produto_embalagens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  embalagemId: integer("embalagem_id").notNull().references(() => embalagens.id, { onDelete: "cascade" }),
  quantidade: real("quantidade").notNull().default(1),
});

export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  aniversario: text("aniversario"),
  comoConheceu: text("como_conheceu"),
  notas: text("notas"),
});

export const pedidos = sqliteTable("pedidos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  tipo: text("tipo").notNull().default("encomenda"),
  dataPedido: text("data_pedido").notNull(),
  dataEntrega: text("data_entrega"),
  formaPagamento: text("forma_pagamento"),
  status: text("status").notNull().default("pendente"),
  observacoes: text("observacoes"),
  caixa: text("caixa"),
  taxaEntrega: real("taxa_entrega").notNull().default(0),
});

export const pedidoItens = sqliteTable("pedido_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pedidoId: integer("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id").notNull().references(() => produtos.id),
  quantidade: integer("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
});

export const planoProducaoItens = sqliteTable("plano_producao_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data").notNull(), // AAAA-MM-DD: dia ao qual esse item do plano pertence
  produtoId: integer("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  quantidadePlanejada: real("quantidade_planejada").notNull(),
  ordem: integer("ordem").notNull().default(0), // prioridade: menor = feito primeiro
  concluido: integer("concluido", { mode: "boolean" }).notNull().default(false),
  quantidadeProduzida: real("quantidade_produzida"),
});

// "Receitas prontas" da Calculadora: um livro de receitas salvas,
// independente do cadastro de Produtos. O custo e preco por unidade sao
// sempre calculados na hora (a partir do preco atual dos ingredientes),
// nunca guardados, para acompanhar automaticamente qualquer mudanca de
// preco sem afetar o historico de vendas ja fechado.
export const GRUPOS_RECEITA = ["brigadeiro", "outros"] as const;
export type GrupoReceita = (typeof GRUPOS_RECEITA)[number];

export const receitas = sqliteTable("receitas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  grupo: text("grupo").notNull().default("outros"),
  pesoUnidadeGramas: real("peso_unidade_gramas"),
  rendimento: real("rendimento").notNull().default(1),
  observacoes: text("observacoes"),
  // Taxa de gas/luz/agua: percentual somado sobre o custo dos ingredientes,
  // igual ja funciona em Produtos (taxaOverhead).
  taxaOverhead: real("taxa_overhead").notNull().default(10),
});

export const receitaIngredientes = sqliteTable("receita_ingredientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receitaId: integer("receita_id").notNull().references(() => receitas.id, { onDelete: "cascade" }),
  ingredienteId: integer("ingrediente_id").notNull().references(() => ingredientes.id),
  gramasUsadas: real("gramas_usadas").notNull(),
});

// Pagamentos recebidos de um pedido. Um pedido pode ter varios pagamentos
// (parciais) em datas diferentes - a soma informa quanto ja foi efetivamente
// recebido, separado de "status" (que continua controlando o fluxo de
// producao/entrega, sem mudar o comportamento ja existente).
export const pagamentos = sqliteTable("pagamentos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pedidoId: integer("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  valor: real("valor").notNull(),
  data: text("data").notNull(), // AAAA-MM-DD: data real em que o dinheiro entrou
  observacoes: text("observacoes"),
});

// Fechamento mensal do Financeiro: congela os valores calculados de um mes
// para que reajustes futuros de preco de ingrediente, ou pagamentos
// registrados depois, nao alterem retroativamente um mes ja fechado.
export const fechamentosMensais = sqliteTable("fechamentos_mensais", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(), // 1-12
  faturamento: real("faturamento").notNull(),
  custoProdutos: real("custo_produtos").notNull(),
  lucroGerado: real("lucro_gerado").notNull(),
  recebido: real("recebido").notNull(),
  pendente: real("pendente").notNull(),
  reservaDespesas: real("reserva_despesas").notNull(),
  reservaFinanceira: real("reserva_financeira").notNull(),
  funcionariaMae: real("funcionaria_mae").notNull(),
  proprietaria: real("proprietaria").notNull(),
  fechadoEm: text("fechado_em").notNull(),
});

export const tentativasLogin = sqliteTable("tentativas_login", {
  ip: text("ip").primaryKey(),
  tentativas: integer("tentativas").notNull().default(0),
  bloqueadoAte: text("bloqueado_ate"),
  ultimaTentativa: text("ultima_tentativa").notNull(),
});

export const STATUS_PEDIDO = ["pendente", "pronto", "entregue", "pago"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

// Encomenda: pedido personalizado, normalmente feito sob demanda/com prazo.
// Pronta entrega: venda de produto ja pronto (ex: caixa fechada), sem producao a combinar.
export const TIPOS_PEDIDO = ["encomenda", "pronta_entrega"] as const;
export type TipoPedido = (typeof TIPOS_PEDIDO)[number];

export const FORMAS_PAGAMENTO = ["pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"] as const;
