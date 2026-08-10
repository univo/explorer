CREATE TABLE "intent_ens_name_registered_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"success" boolean NOT NULL,
	"name" text NOT NULL,
	"duration" "bytea" NOT NULL,
	"owner_address" "bytea" NOT NULL
);
