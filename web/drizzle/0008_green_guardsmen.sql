CREATE TABLE `fechamentos_mensais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ano` integer NOT NULL,
	`mes` integer NOT NULL,
	`faturamento` real NOT NULL,
	`custo_produtos` real NOT NULL,
	`lucro_gerado` real NOT NULL,
	`recebido` real NOT NULL,
	`pendente` real NOT NULL,
	`reserva_despesas` real NOT NULL,
	`reserva_financeira` real NOT NULL,
	`funcionaria_mae` real NOT NULL,
	`proprietaria` real NOT NULL,
	`fechado_em` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`valor` real NOT NULL,
	`data` text NOT NULL,
	`observacoes` text,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade
);
