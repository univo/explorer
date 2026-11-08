CREATE TABLE "intent_erc721_approval_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"token_id" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"token_address" "bytea" NOT NULL,
	"caller_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_erc721_approval_v2_block_timestamp_idx" ON "intent_erc721_approval_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
DROP TABLE "intent_erc721_approval_v1" CASCADE;
