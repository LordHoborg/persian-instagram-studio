CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`generation_session_id` text,
	`operation` text NOT NULL,
	`provider` text DEFAULT 'openai' NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`cached_input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`reasoning_tokens` integer DEFAULT 0 NOT NULL,
	`tool_calls` integer DEFAULT 0 NOT NULL,
	`web_search_calls` integer DEFAULT 0 NOT NULL,
	`image_generation_count` integer DEFAULT 0 NOT NULL,
	`estimated_text_cost` real DEFAULT 0 NOT NULL,
	`web_search_cost` real DEFAULT 0 NOT NULL,
	`image_cost` real DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`duration_ms` integer,
	`post_id` text,
	`prompt_key` text,
	`prompt_version` integer,
	`success` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `automation_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publish_days` text DEFAULT '[]' NOT NULL,
	`suggested_hour` integer DEFAULT 19 NOT NULL,
	`posts_per_day` integer DEFAULT 1 NOT NULL,
	`allowed_formats` text DEFAULT '[]' NOT NULL,
	`auto_generate` integer DEFAULT false NOT NULL,
	`auto_publish` integer DEFAULT false NOT NULL,
	`require_approval` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brand_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_topic` text DEFAULT '' NOT NULL,
	`target_audience` text DEFAULT '' NOT NULL,
	`writing_style` text DEFAULT 'محاوره‌ای ولی آگاهانه' NOT NULL,
	`visual_style` text DEFAULT 'مینیمال و تمیز' NOT NULL,
	`preferred_topics` text DEFAULT '[]' NOT NULL,
	`avoided_topics` text DEFAULT '[]' NOT NULL,
	`preferred_hooks` text DEFAULT '[]' NOT NULL,
	`caption_rules` text DEFAULT '' NOT NULL,
	`persian_language_rules` text DEFAULT '' NOT NULL,
	`cta_style` text DEFAULT '' NOT NULL,
	`source_policy` text DEFAULT '' NOT NULL,
	`image_style` text DEFAULT '' NOT NULL,
	`successful_patterns` text DEFAULT '[]' NOT NULL,
	`failed_patterns` text DEFAULT '[]' NOT NULL,
	`custom_instructions` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '2026-08-21T07:50:27.172Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_pillars` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`weight` integer DEFAULT 20 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learned_patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`pattern` text NOT NULL,
	`confidence` real DEFAULT 0 NOT NULL,
	`evidence` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'generated' NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`reach` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	`profile_visits` integer DEFAULT 0 NOT NULL,
	`follows` integer DEFAULT 0 NOT NULL,
	`engagement_rate` real DEFAULT 0 NOT NULL,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_slides` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`slide_number` integer NOT NULL,
	`type` text DEFAULT 'content' NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`visual_direction` text DEFAULT '' NOT NULL,
	`image_prompt` text DEFAULT '' NOT NULL,
	`image_asset_id` text,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`content_type` text DEFAULT 'carousel' NOT NULL,
	`content_pillar` text DEFAULT '' NOT NULL,
	`goal` text DEFAULT '' NOT NULL,
	`target_audience` text DEFAULT '' NOT NULL,
	`hook` text DEFAULT '' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`cta` text DEFAULT '' NOT NULL,
	`hashtags` text DEFAULT '[]' NOT NULL,
	`image_style` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`prompt_key` text,
	`prompt_version` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`scheduled_at` text,
	`published_at` text,
	`estimated_cost` text DEFAULT '{"textCost":0,"researchCost":0,"imageCost":0,"total":0}' NOT NULL,
	`quality_score` text,
	`performance_metrics` text
);
--> statement-breakpoint
CREATE TABLE `prompt_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_templates_key_unique` ON `prompt_templates` (`key`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`publisher` text DEFAULT '' NOT NULL,
	`published_at` text,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
