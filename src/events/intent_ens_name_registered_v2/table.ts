import { boolean, index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_ens_name_registered_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		success: boolean().notNull(),
		name: text().notNull(),
		duration: hex().notNull(),
		owner_address: hex().notNull(),
		sender_address: hex().notNull(),
		controller_address: hex().notNull(),
	},
	(table) => [
		index("intent_ens_name_registered_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
