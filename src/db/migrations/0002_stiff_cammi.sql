CREATE TABLE "event_tornado_cash_withdrawal_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"fee" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"relayer_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL
);
