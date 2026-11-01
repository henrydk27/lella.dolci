CREATE TABLE `receita_ingredientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`receita_id` integer NOT NULL,
	`ingrediente_id` integer NOT NULL,
	`gramas_usadas` real NOT NULL,
	FOREIGN KEY (`receita_id`) REFERENCES `receitas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receitas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`grupo` text DEFAULT 'outros' NOT NULL,
	`peso_unidade_gramas` real,
	`rendimento` real DEFAULT 1 NOT NULL,
	`observacoes` text
);
