import { index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"log_fwa_nft_listed_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		slot: hex().notNull(),
		weight: hex().notNull(),
		token_id: hex().notNull(),
		listing_id: hex().notNull(),
		backing_eth: hex().notNull(),
		depositor_address: hex().notNull(),
		collection_address: hex().notNull(),
	},
	(table) => [
		index("log_fwa_nft_listed_v2_block_timestamp_idx").on(table.block_timestamp.desc()),
		// Allows us to perform joins on the listing id from other events
		index("log_fwa_nft_listed_v2_listing_id_idx").on(table.listing_id),
	],
);
