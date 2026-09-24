import { index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"log_ens_new_owner_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		label: hex().notNull(),
		owner_address: hex().notNull(),
	},
	(table) => [
		index("log_ens_new_owner_v2_block_timestamp_idx").on(table.block_timestamp.desc()),
		// Allows eligibility checks to find reverse records by the label derived from an account address
		index("log_ens_new_owner_v2_label_idx").on(table.label),
	],
);
