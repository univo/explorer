import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_erc20_approval_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		quantity: hex().notNull(),
		success: boolean().notNull(),
		owner_address: hex().notNull(),
		spender_address: hex().notNull(),
		token_address: hex().notNull(),
	},
	(table) => [
		index("intent_erc20_approval_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
