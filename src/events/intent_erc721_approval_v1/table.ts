import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_erc721_approval_v1", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	success: boolean().notNull(),
	token_address: hex().notNull(),
	caller_address: hex().notNull(),
	spender_address: hex().notNull(),
});
