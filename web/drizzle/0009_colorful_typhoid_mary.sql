ALTER TABLE `produtos` ADD `disponivel_na_caixa` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `produtos` SET `disponivel_na_caixa` = true WHERE lower(trim(`nome`)) LIKE 'brigadeiro%';