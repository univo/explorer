import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_usdc_blacklist_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	account_address: hex().notNull(),
});
