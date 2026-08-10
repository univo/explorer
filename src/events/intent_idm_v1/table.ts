import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_idm_v1", {
	id: id().primaryKey(),
	message: text().notNull(),
	success: boolean().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
});
