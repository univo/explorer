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
CREATE INDEX "event_fwa_nft_listed_v3_listing_id_idx" ON "event_fwa_nft_listed_v3" USING btree ("listing_id");