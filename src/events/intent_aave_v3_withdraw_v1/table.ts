import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_aave_v3_withdraw_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	quantity: hex().notNull(),
	token_address: hex().notNull(),
	recipient_address: hex().notNull(),
	withdrawer_address: hex().notNull(),
});
