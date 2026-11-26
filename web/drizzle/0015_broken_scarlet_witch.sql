CREATE INDEX `pagamentos_pedido_id_idx` ON `pagamentos` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `pagamentos_data_idx` ON `pagamentos` (`data`);--> statement-breakpoint
CREATE INDEX `pedido_itens_pedido_id_idx` ON `pedido_itens` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `pedidos_data_pedido_idx` ON `pedidos` (`data_pedido`);--> statement-breakpoint
CREATE INDEX `pedidos_status_idx` ON `pedidos` (`status`);