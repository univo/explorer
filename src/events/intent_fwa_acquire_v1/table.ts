import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_fwa_acquire_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	submitted_eth: hex().notNull(),
	acquisition_count: hex().notNull(),
	purchaser_address: hex().notNull(),
});
