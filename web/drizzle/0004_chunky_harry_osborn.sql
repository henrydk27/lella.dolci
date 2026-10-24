CREATE TABLE `tentativas_login` (
	`ip` text PRIMARY KEY NOT NULL,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`bloqueado_ate` text,
	`ultima_tentativa` text NOT NULL
);
