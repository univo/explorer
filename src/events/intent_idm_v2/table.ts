import { boolean, index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_idm_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		message: text().notNull(),
		success: boolean().notNull(),
		to_address: hex().notNull(),
		from_address: hex().notNull(),
	},
	(table) => [
		index("intent_idm_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
