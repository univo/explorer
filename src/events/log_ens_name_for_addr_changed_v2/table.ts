import { index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"log_ens_name_for_addr_changed_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		name: text().notNull(),
		account_address: hex().notNull(),
	},
	(table) => [
		index("log_ens_name_for_addr_changed_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
