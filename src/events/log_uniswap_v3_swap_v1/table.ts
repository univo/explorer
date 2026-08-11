import { index, integer, numeric, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

// These integers use native arithmetic types instead of the usual bytea convention because pricing SQL
// needs exact signed values and arbitrary-precision calculations without per-row conversion.

export const table = pgTable(
	"log_uniswap_v3_swap_v1",
	{
		id: id().primaryKey(),
		tick: integer().notNull(),
		pool_address: hex().notNull(),
		sender_address: hex().notNull(),
		recipient_address: hex().notNull(),
		amount_0: numeric({ precision: 78, scale: 0, mode: "bigint" }).notNull(),
		amount_1: numeric({ precision: 78, scale: 0, mode: "bigint" }).notNull(),
		liquidity: numeric({ precision: 39, scale: 0, mode: "bigint" }).notNull(),
		sqrt_price_x96: numeric({ precision: 49, scale: 0, mode: "bigint" }).notNull(),
	},
	(table) => [index("log_uniswap_v3_swap_v1_pool_address_idx").on(table.pool_address)],
);
