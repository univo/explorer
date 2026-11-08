CREATE TABLE "intent_idm_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"message" text NOT NULL,
	"success" boolean NOT NULL,
	"to_address" "bytea" NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_idm_v2_block_timestamp_idx" ON "intent_idm_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
DROP TABLE "intent_idm_v1" CASCADE;
