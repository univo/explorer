import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_erc721_transfer_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		token_id: hex().notNull(),
		to_address: hex().notNull(),
		success: boolean().notNull(),
		from_address: hex().notNull(),
		caller_address: hex().notNull(),
		token_address: hex().notNull(),
	},
	(table) => [
		index("intent_erc721_transfer_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
