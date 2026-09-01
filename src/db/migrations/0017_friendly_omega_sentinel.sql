CREATE TABLE "intent_fwa_acquire_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"submitted_eth" "bytea" NOT NULL,
	"acquisition_count" "bytea" NOT NULL,
	"purchaser_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_fwa_won_v2" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_out" "bytea" NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"payout_eth" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"settlement_type" text NOT NULL,
	"purchaser_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_fwa_nft_allocated_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"backing_eth" "bytea" NOT NULL,
	"purchaser_address" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL
);
