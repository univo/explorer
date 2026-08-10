CREATE TABLE "intent_cancel_pending_tx_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"nonce" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_contract_deployment_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"contract_address" "bytea" NOT NULL,
	"deployer_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_idm_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"success" boolean NOT NULL,
	"to_address" "bytea" NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_native_transfer_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_tornado_withdrawal_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"fee" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"relayer_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_usdc_blacklist_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"account_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_erc20_approval_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_erc20_transfer_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_erc721_approval_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_id" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_erc721_transfer_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_id" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
