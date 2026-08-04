CREATE TABLE "intent_uniswap_v3_mint_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"fee" "bytea" NOT NULL,
	"sender_address" "bytea" NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"token_0_address" "bytea" NOT NULL,
	"token_1_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL,
	"token_0_desired_quantity" "bytea" NOT NULL,
	"token_1_desired_quantity" "bytea" NOT NULL,
	"token_0_minimum_quantity" "bytea" NOT NULL,
	"token_1_minimum_quantity" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_uniswap_v3_swap_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"swap_type" text NOT NULL,
	"exact_quantity" "bytea" NOT NULL,
	"limit_quantity" "bytea" NOT NULL,
	"router_address" "bytea" NOT NULL,
	"sender_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL,
	"token_in_address" "bytea" NOT NULL,
	"token_out_address" "bytea" NOT NULL
);
