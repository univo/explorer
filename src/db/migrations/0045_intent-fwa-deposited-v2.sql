CREATE TABLE "intent_fwa_deposited_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"success" boolean NOT NULL,
	"token_id" "bytea" NOT NULL,
	"backing_eth" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL,
	"collection_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_fwa_deposited_v2_block_timestamp_idx" ON "intent_fwa_deposited_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
SELECT create_hypertable(
	'intent_fwa_deposited_v2',
	by_range('block_timestamp', INTERVAL '1 day'),
	create_default_indexes => FALSE
);
--> statement-breakpoint
ALTER TABLE "intent_fwa_deposited_v2" SET (
	timescaledb.enable_columnstore = TRUE,
	timescaledb.segmentby = 'chain',
	timescaledb.orderby = 'block_timestamp DESC, block_number DESC, tx_index DESC, log_index DESC'
);
--> statement-breakpoint
DROP TABLE "intent_fwa_deposited_v1" CASCADE;
