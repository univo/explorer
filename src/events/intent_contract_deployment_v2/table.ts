import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_contract_deployment_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		success: boolean().notNull(),
		contract_address: hex().notNull(),
		deployer_address: hex().notNull(),
	},
	(table) => [
		index("intent_contract_deployment_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
