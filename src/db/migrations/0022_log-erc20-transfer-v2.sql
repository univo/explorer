CREATE TABLE "log_erc20_transfer_v2" (
	"block_timestamp" timestamp with time zone NOT NULL,
	"chain" smallint NOT NULL,
	"block_number" integer NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_erc20_transfer_v2_block_timestamp_idx" ON "log_erc20_transfer_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
SELECT create_hypertable(
	'log_erc20_transfer_v2',
	by_range('block_timestamp', INTERVAL '1 day'),
	create_default_indexes => FALSE
);
