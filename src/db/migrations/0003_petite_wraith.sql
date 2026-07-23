CREATE TABLE "event_usdc_blacklist_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"account_address" "bytea" NOT NULL
);
