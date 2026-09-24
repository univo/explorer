import { index, integer, pgTable, smallint, timestamp } from "drizzle-orm/pg-core";

import { hex } from "@/db/types";

// These integers use native arithmetic types instead of the usual bytea convention because pricing SQL
// needs to compare and calculate with them directly.

export const table = pgTable(
	"log_uniswap_v3_pool_created_v2",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
		block_timestamp: timestamp({ mode: "date", withTimezone: true }).notNull(),

		fee: integer().notNull(),
		pool_address: hex().notNull(),
		token_0_address: hex().notNull(),
		token_1_address: hex().notNull(),
		tick_spacing: integer().notNull(),
	},
	(table) => [
		index("log_uniswap_v3_pool_created_v2_block_timestamp_idx").on(table.block_timestamp.desc()),
		index("log_uniswap_v3_pool_created_v2_pool_address_idx").on(table.pool_address),
		index("log_uniswap_v3_pool_created_v2_token_0_address_idx").on(table.token_0_address),
		index("log_uniswap_v3_pool_created_v2_token_1_address_idx").on(table.token_1_address),
	],
);
