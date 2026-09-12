CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_owner_photo` ON `bookmarks` (`user_id`,`photo_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`photo_title` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'eur' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_session_id` text,
	`payment_intent` text,
	`created_at` text NOT NULL,
	`paid_at` text,
	`consent_at` text NOT NULL,
	`terms_version` text NOT NULL,
	`license_text` text NOT NULL,
	`seller_snapshot` text NOT NULL,
	`downloaded_at` text,
	`receipt_sent_at` text,
	`buyer_email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_id_unique` ON `orders` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `orders_owner` ON `orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_payment` ON `orders` (`payment_intent`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`caption` text NOT NULL,
	`alt` text NOT NULL,
	`category` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`camera` text DEFAULT '' NOT NULL,
	`lens` text DEFAULT '' NOT NULL,
	`settings` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`original_key` text NOT NULL,
	`preview_key` text NOT NULL,
	`original_name` text NOT NULL,
	`original_type` text NOT NULL,
	`original_size` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`rights_confirmed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_slug_unique` ON `photos` (`slug`);--> statement-breakpoint
CREATE INDEX `photos_published_date` ON `photos` (`published`,`created_at`);--> statement-breakpoint
CREATE TABLE `presets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presets_owner` ON `presets` (`user_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`accepted_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_expiry` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `customer_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_owner` ON `customer_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `requests_status` ON `customer_requests` (`status`);