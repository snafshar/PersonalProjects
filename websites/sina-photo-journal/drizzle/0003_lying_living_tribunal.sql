CREATE TABLE `custom_order_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_order_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `custom_messages_order` ON `custom_order_messages` (`custom_order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `custom_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`contact_email` text NOT NULL,
	`title` text NOT NULL,
	`service` text NOT NULL,
	`intended_use` text NOT NULL,
	`brief` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`target_date` text DEFAULT '' NOT NULL,
	`budget_cents` integer,
	`status` text DEFAULT 'submitted' NOT NULL,
	`quote_cents` integer,
	`proposal` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`terms_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `custom_orders_owner` ON `custom_orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `custom_orders_status` ON `custom_orders` (`status`,`created_at`);