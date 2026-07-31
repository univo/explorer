CREATE TABLE "log_fwa_nft_listed_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"slot" "bytea" NOT NULL,
	"weight" "bytea" NOT NULL,
	"token_id" "bytea" NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"backing_eth" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL,
	"collection_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_fwa_won_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_out" "bytea" NOT NULL,
	"listing_id" "bytea" NOT NULL,
	"payout_eth" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"retained_eth" "bytea" NOT NULL,
	"settlement_type" text NOT NULL,
	"purchaser_address" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_fwa_deposited_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"token_id" "bytea" NOT NULL,
	"backing_eth" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL,
	"collection_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_fwa_nft_listed_v1_listing_id_idx" ON "log_fwa_nft_listed_v1" USING btree ("listing_id");