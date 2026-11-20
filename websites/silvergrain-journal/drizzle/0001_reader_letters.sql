CREATE TABLE `journal_contact_rates` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_letters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender` text NOT NULL,
	`email` text NOT NULL,
	`body` text NOT NULL,
	`received` integer NOT NULL,
	`ticket` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_letters_ticket_unique` ON `journal_letters` (`ticket`);