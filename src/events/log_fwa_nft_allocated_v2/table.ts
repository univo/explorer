import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"log_fwa_nft_allocated_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),
		success: boolean().notNull(),

		listing_id: hex().notNull(),
		backing_eth: hex().notNull(),
		purchaser_address: hex().notNull(),
		depositor_address: hex().notNull(),
	},
	(table) => [
		index("log_fwa_nft_allocated_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
