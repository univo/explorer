CREATE TABLE "log_ens_reverse_claimed_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"node" "bytea" NOT NULL,
	"account_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_ens_reverse_claimed_v2_block_timestamp_idx" ON "log_ens_reverse_claimed_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
DROP TABLE "log_ens_reverse_claimed_v1" CASCADE;
