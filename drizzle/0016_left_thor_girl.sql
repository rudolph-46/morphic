CREATE TABLE "user_agents" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(256) NOT NULL,
	"color" varchar(32) DEFAULT 'zinc' NOT NULL,
	"icon" varchar(64) DEFAULT 'Sparkles' NOT NULL,
	"description" text,
	"system_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_projects" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(256) NOT NULL,
	"color" varchar(32) DEFAULT 'zinc' NOT NULL,
	"icon" varchar(64) DEFAULT 'Folder' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "user_agents_user_idx" ON "user_agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_projects_user_idx" ON "user_projects" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "user_agents_select_own" ON "user_agents" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_agents_insert_own" ON "user_agents" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_agents_update_own" ON "user_agents" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_agents_delete_own" ON "user_agents" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_projects_select_own" ON "user_projects" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_projects_insert_own" ON "user_projects" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_projects_update_own" ON "user_projects" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_projects_delete_own" ON "user_projects" AS PERMISSIVE FOR DELETE TO public USING (true);