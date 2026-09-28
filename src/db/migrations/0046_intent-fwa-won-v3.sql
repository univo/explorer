CREATE TABLE "intent_fwa_won_v3" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"token_out" "bytea" NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"payout_eth" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"settlement_type" text NOT NULL,
	"purchaser_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_fwa_won_v3_block_timestamp_idx" ON "intent_fwa_won_v3" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
SELECT create_hypertable(
	'intent_fwa_won_v3',
	by_range('block_timestamp', INTERVAL '1 day'),
	create_default_indexes => FALSE
);
--> statement-breakpoint
ALTER TABLE "intent_fwa_won_v3" SET (
	timescaledb.enable_columnstore = TRUE,
	timescaledb.segmentby = 'chain',
	timescaledb.orderby = 'block_timestamp DESC, block_number DESC, tx_index DESC, log_index DESC'
);
--> statement-breakpoint
DROP TABLE "intent_fwa_won_v2" CASCADE;
