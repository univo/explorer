import { index, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable(
	"log_uniswap_v3_swap_v1",
	{
		id: id().primaryKey(),
		tick: hex().notNull(),
		amount_0: hex().notNull(),
		amount_1: hex().notNull(),
		liquidity: hex().notNull(),
		pool_address: hex().notNull(),
		sender_address: hex().notNull(),
		recipient_address: hex().notNull(),
		sqrt_price_x96: hex().notNull(),
	},
	(table) => [index("log_uniswap_v3_swap_v1_pool_address_idx").on(table.pool_address)],
);
