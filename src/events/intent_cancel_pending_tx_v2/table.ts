import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_cancel_pending_tx_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		nonce: hex().notNull(),
		success: boolean().notNull(),
		from_address: hex().notNull(),
	},
	(table) => [
		index("intent_cancel_pending_tx_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
