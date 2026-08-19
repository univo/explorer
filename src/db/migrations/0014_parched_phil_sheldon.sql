CREATE TABLE "log_ens_new_owner_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"label" "bytea" NOT NULL,
	"owner_address" "bytea" NOT NULL
);
--> statement-breakpoint
DROP INDEX "log_ens_name_for_addr_changed_v1_account_address_idx";--> statement-breakpoint
DROP INDEX "log_ens_reverse_claimed_v1_account_address_idx";--> statement-breakpoint
CREATE INDEX "log_ens_new_owner_v1_label_idx" ON "log_ens_new_owner_v1" USING btree ("label");