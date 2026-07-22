import { boolean, pgTable, smallint, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_tornado_cash_deposit_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	commitment: hex().notNull(),
	quantity: hex().notNull(),
	asset_symbol: text().notNull(),
	asset_decimals: smallint().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
	pool_address: hex().notNull(),
});
