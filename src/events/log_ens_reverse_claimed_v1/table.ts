import { pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("log_ens_reverse_claimed_v1", {
	id: id().primaryKey(),
	node: hex().notNull(),
	account_address: hex().notNull(),
});
