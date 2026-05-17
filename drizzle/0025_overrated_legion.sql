CREATE TABLE "inbox_ai_messages" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"thread_id" varchar(191) NOT NULL,
	"role" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inbox_ai_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inbox_ai_messages" ADD CONSTRAINT "inbox_ai_messages_thread_id_linkedin_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."linkedin_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbox_ai_messages_thread_idx" ON "inbox_ai_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE POLICY "inbox_ai_messages_select_own" ON "inbox_ai_messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "inbox_ai_messages_insert_own" ON "inbox_ai_messages" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "inbox_ai_messages_delete_own" ON "inbox_ai_messages" AS PERMISSIVE FOR DELETE TO public USING (true);