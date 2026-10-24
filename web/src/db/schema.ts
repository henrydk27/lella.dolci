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
  custoTotal: real("custo_total").notNull().default(0),
  rendimento: integer("rendimento").notNull().default(1),
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

export const gastos = sqliteTable("gastos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  data: text("data").notNull(),
  tipoPagamento: text("tipo_pagamento"),
  categoria: text("categoria"),
  valor: real("valor").notNull().default(0),
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
