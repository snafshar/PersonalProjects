CREATE TABLE `journal_visit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_key` text NOT NULL,
	`visitor` text NOT NULL,
	`session` text NOT NULL,
	`created` integer NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`ip` text NOT NULL,
	`country` text NOT NULL,
	`region` text NOT NULL,
	`city` text NOT NULL,
	`device` text NOT NULL,
	`browser` text NOT NULL,
	`os` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_visit_events_event_key_unique` ON `journal_visit_events` (`event_key`);--> statement-breakpoint
CREATE INDEX `visit_events_created` ON `journal_visit_events` (`created`);--> statement-breakpoint
CREATE INDEX `visit_events_session` ON `journal_visit_events` (`session`,`created`);--> statement-breakpoint
CREATE INDEX `visit_events_visitor` ON `journal_visit_events` (`visitor`,`created`);--> statement-breakpoint
CREATE INDEX `visit_events_path` ON `journal_visit_events` (`path`,`created`);--> statement-breakpoint
CREATE TABLE `journal_visit_rates` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_visit_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`started` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`source` text NOT NULL,
	`referrer` text NOT NULL,
	`campaign` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visit_sessions_seen` ON `journal_visit_sessions` (`last_seen`);--> statement-breakpoint
CREATE TABLE `journal_visit_visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`consented` integer NOT NULL,
	`policy` text NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visit_visitors_seen` ON `journal_visit_visitors` (`last_seen`);