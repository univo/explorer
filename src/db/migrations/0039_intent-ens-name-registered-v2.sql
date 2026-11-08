CREATE TABLE "intent_ens_name_registered_v2" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"success" boolean NOT NULL,
	"name" text NOT NULL,
	"duration" "bytea" NOT NULL,
	"owner_address" "bytea" NOT NULL,
	"sender_address" "bytea" NOT NULL,
	"controller_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intent_ens_name_registered_v2_block_timestamp_idx" ON "intent_ens_name_registered_v2" USING btree ("block_timestamp" DESC NULLS LAST);
--> statement-breakpoint
DROP TABLE "intent_ens_name_registered_v1" CASCADE;
