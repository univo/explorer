import { boolean, index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

export const table = pgTable(
	"intent_uniswap_v3_mint_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		success: boolean().notNull(),
		fee: hex().notNull(),
		sender_address: hex().notNull(),
		pool_address: hex().notNull(),
		token_0_address: hex().notNull(),
		token_1_address: hex().notNull(),
		recipient_address: hex().notNull(),
		token_0_desired_quantity: hex().notNull(),
		token_1_desired_quantity: hex().notNull(),
		token_0_minimum_quantity: hex().notNull(),
		token_1_minimum_quantity: hex().notNull(),
	},
	(table) => [
		index("intent_uniswap_v3_mint_v2_block_timestamp_idx").on(table.block_timestamp.desc()), //
	],
);
