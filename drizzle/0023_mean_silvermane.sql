CREATE TABLE "linkedin_avatars" (
	"provider_id" varchar(256) PRIMARY KEY NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"mime" varchar(64) NOT NULL,
	"bytes" "bytea" NOT NULL,
	"source_url" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linkedin_avatars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "linkedin_avatars_account_idx" ON "linkedin_avatars" USING btree ("account_id");--> statement-breakpoint
CREATE POLICY "linkedin_avatars_select_own" ON "linkedin_avatars" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_avatars_insert_own" ON "linkedin_avatars" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "linkedin_avatars_update_own" ON "linkedin_avatars" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_avatars_delete_own" ON "linkedin_avatars" AS PERMISSIVE FOR DELETE TO public USING (true);