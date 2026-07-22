import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_ens_name_registered_v3", {
	id: id().primaryKey(),
	name: text().notNull(),
	cost_eth: hex().notNull(),
	expires_at: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
});
