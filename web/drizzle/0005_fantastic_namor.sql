ALTER TABLE `embalagens` ADD `categoria` text;--> statement-breakpoint
ALTER TABLE `embalagens` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `pedidos` ADD `caixa` text;--> statement-breakpoint
ALTER TABLE `pedidos` ADD `taxa_entrega` real DEFAULT 0 NOT NULL;