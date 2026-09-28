import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_tornado_withdrawal_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		fee: hex().notNull(),
		to_address: hex().notNull(),
		success: boolean().notNull(),
		from_address: hex().notNull(),
		pool_address: hex().notNull(),
		relayer_address: hex().notNull(),
		recipient_address: hex().notNull(),
	},
	(table) => [
		index("intent_tornado_withdrawal_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
