CREATE TABLE "event_fwa_position_settled_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"settlement_type" text NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"payout_eth" "bytea" NOT NULL,
	"retained_eth" "bytea" NOT NULL,
	"token_out" "bytea" NOT NULL,
	"purchaser_address" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL
);
