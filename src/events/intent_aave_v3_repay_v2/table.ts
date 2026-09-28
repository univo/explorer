import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_aave_v3_repay_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		quantity: hex().notNull(),
		success: boolean().notNull(),
		token_address: hex().notNull(),
		repayer_address: hex().notNull(),
		on_behalf_of_address: hex().notNull(),
	},
	(table) => [
		index("intent_aave_v3_repay_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
