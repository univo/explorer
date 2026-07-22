CREATE TABLE "event_cancel_pending_tx_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"nonce" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_contract_deployment_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"contract_address" "bytea" NOT NULL,
	"deployer_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_ens_name_registered_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cost_eth" "bytea" NOT NULL,
	"expires_at" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_erc20_approval_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_erc20_transfer_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_erc721_approval_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_id" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"spender_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_erc721_transfer_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_id" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL,
	"token_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_input_data_message_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"success" boolean NOT NULL,
	"to_address" "bytea" NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_native_transfer_v3" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"quantity" "bytea" NOT NULL,
	"to_address" "bytea" NOT NULL,
	"success" boolean NOT NULL,
	"from_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "index_account_v3" (
	"account" "bytea" NOT NULL,
	"event_id" "bytea" NOT NULL,
	CONSTRAINT "index_account_v3_account_event_id_pk" PRIMARY KEY("account","event_id")
);
--> statement-breakpoint
CREATE TABLE "index_block_number_tx_index_v3" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"table_id" smallint NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" integer NOT NULL,
	CONSTRAINT "index_block_number_tx_index_v3_chain_block_number_tx_index_log_index_pk" PRIMARY KEY("chain","block_number","tx_index","log_index")
);
--> statement-breakpoint
CREATE TABLE "state_accounts_v3" (
	"chain" integer NOT NULL,
	"address" text NOT NULL,
	"is_contract" boolean,
	"owner_project" text,
	"contract_name" text,
	"code_compiler" text,
	"code_language" text,
	"deployment_tx" text,
	"deployer_block" text,
	"usage_category" text,
	"deployer_address" text,
	"source_code_verified" text,
	"erc_type" text,
	"erc20.name" text,
	"erc20.symbol" text,
	"erc20.decimals" text,
	CONSTRAINT "state_accounts_v3_chain_address_pk" PRIMARY KEY("chain","address")
);
--> statement-breakpoint
CREATE TABLE "state_tokens_v1" (
	"name" text,
	"image" text,
	"symbol" text,
	"decimals" smallint,
	"address" text NOT NULL,
	"chain" integer NOT NULL,
	CONSTRAINT "state_tokens_v1_chain_address_pk" PRIMARY KEY("chain","address")
);
