CREATE TABLE "intent_aave_v3_borrow_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"quantity" "bytea" NOT NULL,
	"referral_code" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL,
	"borrower_address" "bytea" NOT NULL,
	"interest_rate_mode" "bytea" NOT NULL,
	"on_behalf_of_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_aave_v3_repay_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"token_address" "bytea" NOT NULL,
	"repayer_address" "bytea" NOT NULL,
	"on_behalf_of_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_aave_v3_supply_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"quantity" "bytea" NOT NULL,
	"referral_code" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL,
	"supplier_address" "bytea" NOT NULL,
	"on_behalf_of_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_aave_v3_withdraw_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"quantity" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL,
	"withdrawer_address" "bytea" NOT NULL
);
