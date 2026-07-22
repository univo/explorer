import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_erc20_approval_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
	spender_address: hex().notNull(),
	token_address: hex().notNull(),
});
