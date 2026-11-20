CREATE TABLE `journal_media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`bytes` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`draft` text NOT NULL,
	`live` text
);
--> statement-breakpoint
CREATE TABLE `journal_settings` (
	`name` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
