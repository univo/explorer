import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_ens_name_registered_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	name: text().notNull(),
	duration: hex().notNull(),
	owner_address: hex().notNull(),
});
