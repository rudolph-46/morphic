ALTER TABLE "user_profiles" ADD COLUMN "inbox_auto_tag" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "inbox_last_sync_at" timestamp;