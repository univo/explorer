CREATE TABLE "index_account_v4" (
	"account" "bytea" NOT NULL,
	"chain" smallint NOT NULL,
	"table_id" smallint NOT NULL,
	"block_timestamp" integer NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "index_account_v4_timeline_idx" ON "index_account_v4" USING btree ("account","block_timestamp","chain","table_id");