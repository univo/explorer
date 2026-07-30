import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_fwa_nft_deposited_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	token_id: hex().notNull(),
	backing_eth: hex().notNull(),
	depositor_address: hex().notNull(),
	collection_address: hex().notNull(),
});
