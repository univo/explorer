import { index, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable(
	"log_uniswap_v3_pool_created_v1",
	{
		id: id().primaryKey(),
		fee: hex().notNull(),
		tick_spacing: hex().notNull(),
		pool_address: hex().notNull(),
		token_0_address: hex().notNull(),
		token_1_address: hex().notNull(),
	},
	(table) => [
		index("log_uniswap_v3_pool_created_v1_pool_address_idx").on(table.pool_address),
		index("log_uniswap_v3_pool_created_v1_token_0_address_idx").on(table.token_0_address),
		index("log_uniswap_v3_pool_created_v1_token_1_address_idx").on(table.token_1_address),
	],
);
