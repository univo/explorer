import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_usdc_blacklist_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	account_address: hex().notNull(),
});
