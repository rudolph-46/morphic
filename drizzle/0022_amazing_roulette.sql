CREATE TABLE "chat_perf_traces" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"chat_id" varchar(191),
	"message_id" varchar(191),
	"user_id" varchar(255) NOT NULL,
	"model" varchar(256),
	"search_mode" varchar(32),
	"query_length" integer DEFAULT 0 NOT NULL,
	"thinking_enabled" boolean DEFAULT false NOT NULL,
	"thinking_budget_tokens" integer,
	"preflight_ms" integer,
	"mcp_setup_ms" integer,
	"ttft_ms" integer,
	"streaming_ms" integer,
	"total_ms" integer NOT NULL,
	"tool_call_count" integer DEFAULT 0 NOT NULL,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mcp_tool_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_read_tokens" integer,
	"cache_creation_tokens" integer,
	"label" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_perf_traces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "chat_perf_user_idx" ON "chat_perf_traces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_perf_created_idx" ON "chat_perf_traces" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_perf_label_idx" ON "chat_perf_traces" USING btree ("label");--> statement-breakpoint
CREATE POLICY "chat_perf_select_own" ON "chat_perf_traces" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "chat_perf_insert_own" ON "chat_perf_traces" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);