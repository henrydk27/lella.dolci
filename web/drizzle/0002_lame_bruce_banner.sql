CREATE TABLE `plano_producao_itens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data` text NOT NULL,
	`produto_id` integer NOT NULL,
	`quantidade_planejada` real NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`concluido` integer DEFAULT false NOT NULL,
	`quantidade_produzida` real,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `produtos` ADD `estoque_produzido` real DEFAULT 0 NOT NULL;