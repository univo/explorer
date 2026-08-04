import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_uniswap_v3_mint_v1", {
	id: id().primaryKey(),
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
});
