CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`telefone` text,
	`email` text,
	`endereco` text,
	`aniversario` text,
	`como_conheceu` text,
	`notas` text
);
--> statement-breakpoint
CREATE TABLE `embalagens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`custo_total` real DEFAULT 0 NOT NULL,
	`rendimento` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `embalagens_nome_unique` ON `embalagens` (`nome`);--> statement-breakpoint
CREATE TABLE `gastos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`data` text NOT NULL,
	`tipo_pagamento` text,
	`categoria` text,
	`valor` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingredientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`unidade` text NOT NULL,
	`quantidade_estoque` real DEFAULT 0 NOT NULL,
	`preco_unitario` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredientes_nome_unique` ON `ingredientes` (`nome`);--> statement-breakpoint
CREATE TABLE `pedido_itens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`produto_id` integer NOT NULL,
	`quantidade` integer NOT NULL,
	`preco_unitario` real NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer,
	`data_pedido` text NOT NULL,
	`data_entrega` text,
	`forma_pagamento` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`observacoes` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `produto_embalagens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`embalagem_id` integer NOT NULL,
	`quantidade` real DEFAULT 1 NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`embalagem_id`) REFERENCES `embalagens`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `produto_ingredientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`ingrediente_id` integer NOT NULL,
	`quantidade` real NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`preco` real NOT NULL,
	`descricao` text,
	`categoria` text,
	`taxa_overhead` real DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produtos_nome_unique` ON `produtos` (`nome`);