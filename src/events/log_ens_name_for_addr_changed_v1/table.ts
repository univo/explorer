import { pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("log_ens_name_for_addr_changed_v1", {
	id: id().primaryKey(),
	name: text().notNull(),
	account_address: hex().notNull(),
});
