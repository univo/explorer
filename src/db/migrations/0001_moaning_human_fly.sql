CREATE TABLE "index_block_number_tx_index_v4" (
	"chain" smallint NOT NULL,
	"tx_index" smallint NOT NULL,
	"log_index" integer NOT NULL,
	"table_id" smallint NOT NULL,
	"block_number" integer NOT NULL,
	"block_timestamp" integer NOT NULL,
	CONSTRAINT "index_block_number_tx_index_v4_chain_block_number_tx_index_log_index_table_id_pk" PRIMARY KEY("chain","block_number","tx_index","log_index","table_id")
);
--> statement-breakpoint
DROP TABLE "index_block_number_tx_index_v3" CASCADE;