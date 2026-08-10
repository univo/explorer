import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_tornado_withdrawal_v1", {
	id: id().primaryKey(),
	fee: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	pool_address: hex().notNull(),
	relayer_address: hex().notNull(),
	recipient_address: hex().notNull(),
});
