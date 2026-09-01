import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_fwa_won_v2", {
	id: id().primaryKey(),
	token_out: hex().notNull(),
	listing_id: hex().notNull(),
	payout_eth: hex().notNull(),
	success: boolean().notNull(),
	settlement_type: text().notNull(),
	purchaser_address: hex().notNull(),
});
