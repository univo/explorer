CREATE TABLE "event_fwa_nft_deposited_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"token_id" "bytea" NOT NULL,
	"backing_eth" "bytea" NOT NULL,
	"depositor_address" "bytea" NOT NULL,
	"collection_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_fwa_nft_listed_v3" (
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
CREATE TABLE "event_fwa_won_v3" (
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
--> statement-breakpoint
CREATE INDEX "event_fwa_nft_listed_v3_listing_id_idx" ON "event_fwa_nft_listed_v3" USING btree ("listing_id");