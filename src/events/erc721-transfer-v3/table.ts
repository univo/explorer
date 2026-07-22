import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_erc721_transfer_v3", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});
