CREATE TABLE "intent_erc20_approval_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_erc20_transfer_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_erc721_approval_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"approved" boolean NOT NULL,
	"token_id" "bytea",
	"success" boolean NOT NULL,
	"caller_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_erc721_transfer_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_id" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"caller_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
