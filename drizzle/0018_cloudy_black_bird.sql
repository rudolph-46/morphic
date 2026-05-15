CREATE TABLE "linkedin_messages" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"thread_id" varchar(191) NOT NULL,
	"provider_message_id" varchar(256) NOT NULL,
	"sender_provider_id" varchar(256),
	"is_from_me" boolean DEFAULT false NOT NULL,
	"body" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linkedin_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "linkedin_threads" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"provider_chat_id" varchar(256) NOT NULL,
	"provider" varchar(50) DEFAULT 'LINKEDIN' NOT NULL,
	"attendee_name" varchar(256),
	"attendee_headline" text,
	"attendee_provider_id" varchar(256),
	"attendee_avatar_url" text,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"ai_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linkedin_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "linkedin_messages" ADD CONSTRAINT "linkedin_messages_thread_id_linkedin_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."linkedin_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "linkedin_messages_thread_idx" ON "linkedin_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "linkedin_messages_provider_msg_idx" ON "linkedin_messages" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "linkedin_threads_user_idx" ON "linkedin_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linkedin_threads_account_idx" ON "linkedin_threads" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "linkedin_threads_provider_chat_idx" ON "linkedin_threads" USING btree ("provider_chat_id");--> statement-breakpoint
CREATE POLICY "linkedin_messages_select_own" ON "linkedin_messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_messages_insert_own" ON "linkedin_messages" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "linkedin_messages_update_own" ON "linkedin_messages" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_messages_delete_own" ON "linkedin_messages" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_threads_select_own" ON "linkedin_threads" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_threads_insert_own" ON "linkedin_threads" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "linkedin_threads_update_own" ON "linkedin_threads" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_threads_delete_own" ON "linkedin_threads" AS PERMISSIVE FOR DELETE TO public USING (true);