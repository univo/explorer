CREATE TABLE "log_uniswap_v3_swap_v2" (
	"block_timestamp" timestamp with time zone NOT NULL,
	"chain" smallint NOT NULL,
	"block_number" integer NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"tick" integer NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"sender_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL,
	"amount_0" numeric(78, 0) NOT NULL,
	"amount_1" numeric(78, 0) NOT NULL,
	"liquidity" numeric(39, 0) NOT NULL,
	"sqrt_price_x96" numeric(49, 0) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_uniswap_v3_swap_v2_block_timestamp_idx" ON "log_uniswap_v3_swap_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
SELECT create_hypertable(
	'log_uniswap_v3_swap_v2',
	by_range('block_timestamp', INTERVAL '1 day'),
	create_default_indexes => FALSE
);
--> statement-breakpoint
ALTER TABLE "log_uniswap_v3_swap_v2" SET (
	timescaledb.enable_columnstore = TRUE,
	timescaledb.segmentby = 'chain',
	timescaledb.orderby = 'block_timestamp DESC, block_number DESC, tx_index DESC, log_index DESC'
);
--> statement-breakpoint
DROP TABLE "log_uniswap_v3_swap_v1" CASCADE;
