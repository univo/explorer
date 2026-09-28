import { boolean, index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_fwa_won_v3",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		token_out: hex().notNull(),
		listing_id: hex().notNull(),
		payout_eth: hex().notNull(),
		success: boolean().notNull(),
		settlement_type: text().notNull(),
		purchaser_address: hex().notNull(),
	},
	(table) => [
		index("intent_fwa_won_v3_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
