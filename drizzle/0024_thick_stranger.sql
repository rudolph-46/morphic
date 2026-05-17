CREATE TABLE "linkedin_profiles" (
	"provider_id" varchar(256) PRIMARY KEY NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"raw" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linkedin_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "linkedin_profiles_account_idx" ON "linkedin_profiles" USING btree ("account_id");--> statement-breakpoint
CREATE POLICY "linkedin_profiles_select_own" ON "linkedin_profiles" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_profiles_insert_own" ON "linkedin_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "linkedin_profiles_update_own" ON "linkedin_profiles" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "linkedin_profiles_delete_own" ON "linkedin_profiles" AS PERMISSIVE FOR DELETE TO public USING (true);