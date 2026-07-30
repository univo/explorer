import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_fwa_position_settled_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	settlement_type: text().notNull(),
	listing_id: hex().notNull(),
	payout_eth: hex().notNull(),
	retained_eth: hex().notNull(),
	token_out: hex().notNull(),
	purchaser_address: hex().notNull(),
	depositor_address: hex().notNull(),
});
