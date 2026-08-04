import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_uniswap_v3_swap_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	swap_type: text().notNull(),
	exact_quantity: hex().notNull(),
	limit_quantity: hex().notNull(),
	router_address: hex().notNull(),
	sender_address: hex().notNull(),
	recipient_address: hex().notNull(),
	token_in_address: hex().notNull(),
	token_out_address: hex().notNull(),
});
