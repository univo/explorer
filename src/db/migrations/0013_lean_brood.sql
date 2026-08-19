CREATE TABLE "cache_ens" (
	"chain" integer NOT NULL,
	"address" text NOT NULL,
	"ens" varchar(255),
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "cache_ens_chain_address_pk" PRIMARY KEY("chain","address")
);
--> statement-breakpoint
CREATE TABLE "log_ens_name_for_addr_changed_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_ens_reverse_claimed_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"node" "bytea" NOT NULL,
	"account_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_ens_name_for_addr_changed_v1_account_address_idx" ON "log_ens_name_for_addr_changed_v1" USING btree ("account_address");--> statement-breakpoint
CREATE INDEX "log_ens_reverse_claimed_v1_account_address_idx" ON "log_ens_reverse_claimed_v1" USING btree ("account_address");