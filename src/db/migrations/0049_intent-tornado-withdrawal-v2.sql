CREATE TABLE "intent_tornado_withdrawal_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"fee" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"relayer_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_tornado_withdrawal_v2_block_timestamp_idx" ON "intent_tornado_withdrawal_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
DROP TABLE "intent_tornado_withdrawal_v1" CASCADE;
