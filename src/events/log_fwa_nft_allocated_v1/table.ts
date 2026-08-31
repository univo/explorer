import { pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("log_fwa_nft_allocated_v1", {
	id: id().primaryKey(),
	request_id: hex().notNull(),
	listing_id: hex().notNull(),
	backing_eth: hex().notNull(),
	random_word: hex().notNull(),
	purchaser_address: hex().notNull(),
	depositor_address: hex().notNull(),
});
