import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_erc721_transfer_v1", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	caller_address: hex().notNull(),
	token_address: hex().notNull(),
});
