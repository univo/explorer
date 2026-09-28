CREATE TABLE "intent_cancel_pending_tx_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"nonce" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
DROP TABLE "intent_cancel_pending_tx_v1" CASCADE;--> statement-breakpoint
CREATE INDEX "intent_cancel_pending_tx_v2_block_timestamp_idx" ON "intent_cancel_pending_tx_v2" USING btree ("block_timestamp" DESC NULLS LAST);