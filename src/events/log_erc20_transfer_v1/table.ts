import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("log_erc20_transfer_v1", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});
