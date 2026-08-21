PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_brand_profile` (
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
	`updated_at` text DEFAULT '2026-08-21T10:55:26.933Z' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_brand_profile`("id", "page_topic", "target_audience", "writing_style", "visual_style", "preferred_topics", "avoided_topics", "preferred_hooks", "caption_rules", "persian_language_rules", "cta_style", "source_policy", "image_style", "successful_patterns", "failed_patterns", "custom_instructions", "updated_at") SELECT "id", "page_topic", "target_audience", "writing_style", "visual_style", "preferred_topics", "avoided_topics", "preferred_hooks", "caption_rules", "persian_language_rules", "cta_style", "source_policy", "image_style", "successful_patterns", "failed_patterns", "custom_instructions", "updated_at" FROM `brand_profile`;--> statement-breakpoint
DROP TABLE `brand_profile`;--> statement-breakpoint
ALTER TABLE `__new_brand_profile` RENAME TO `brand_profile`;--> statement-breakpoint
PRAGMA foreign_keys=ON;