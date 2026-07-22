CREATE TABLE "event_tornado_cash_deposit_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"commitment" "bytea" NOT NULL,
	"quantity" "bytea" NOT NULL,
	"asset_symbol" text NOT NULL,
	"asset_decimals" smallint NOT NULL,
	"to_address" "bytea" NOT NULL,
	"from_address" "bytea" NOT NULL,
	"pool_address" "bytea" NOT NULL
);
